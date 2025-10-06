// main.js
document.addEventListener("DOMContentLoaded", () => {
  // Forms
  const employerForm = document.getElementById("employerForm");
  const employeeForm = document.getElementById("employeeForm");

  // Alerts
  const successAlert = document.getElementById("successAlert");
  const errorAlert = document.getElementById("errorAlert");
  const errorAlertMsg = document.getElementById("errorAlertMsg");

  // Utility: generate a unique idempotency key
  function generateIdempotencyKey() {
    return "pepper-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10);
  }

  // Utility: show Bootstrap alert
  function showAlert(element, isSuccess, msg = null) {
    const alertEl = isSuccess ? successAlert : errorAlert;
    if (!isSuccess && msg) errorAlertMsg.textContent = msg;

    alertEl.classList.remove("d-none");
    alertEl.classList.add("show");
    alertEl.style.opacity = "1";

    setTimeout(() => {
      alertEl.classList.remove("show");
      alertEl.classList.add("d-none");
    }, 6000);
  }

  // Core submit logic
  async function handleFormSubmit(event, formType) {
    event.preventDefault();
    const form = event.target;

    // Basic validation
    if (!form.checkValidity()) {
      event.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    // Disable button to prevent duplicate submits
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      // Get reCAPTCHA token
      const token = await grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, { action: formType });
      const idempotencyKey = generateIdempotencyKey();

      // Prepare form data
      const formData = new FormData(form);
      formData.set("recaptcha_token", token);
      formData.set("idempotency_key", idempotencyKey);

      // Determine API endpoint
      const endpoint =
        formType === "employer"
          ? `${CONFIG.API_BASE_URL}/employer`
          : `${CONFIG.API_BASE_URL}/employee`;

      // Send request to API Gateway
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "X-Idempotency-Key": idempotencyKey,
        },
        body: formData, // includes file uploads
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("API Error:", errBody);
        throw new Error("Submission failed. Please try again later.");
      }

      const result = await response.json();
      console.log("Success:", result);
      showAlert(successAlert, true);
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      showAlert(errorAlert, false, error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        formType === "employer" ? "Submit Employer Form" : "Submit Employee Form";
    }
  }

  // Attach handlers
  if (employerForm) {
    employerForm.addEventListener("submit", (e) => handleFormSubmit(e, "employer"));
  }
  if (employeeForm) {
    employeeForm.addEventListener("submit", (e) => handleFormSubmit(e, "employee"));
  }
});
