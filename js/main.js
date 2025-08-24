// Initial Setup

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------
  // Helpers (used by contact form)
  // ---------------------------
  const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  );

  const showAlert = (el, message) => {
    if (!el) return;
    // if it's the error alert and a message is provided, set it
    if (message) {
      const span = el.querySelector('#errorAlertMsg');
      if (span) span.textContent = message;
    }
    el.classList.remove('d-none');
    // allow .fade + .show to animate
    setTimeout(() => el.classList.add('show'), 10);
  };

  const hideAlert = (el) => {
    if (!el) return;
    el.classList.remove('show');
    setTimeout(() => el.classList.add('d-none'), 300);
  };

  const setBtnLoading = (btn, isLoading, restoreText) => {
    if (!btn) return;
    if (isLoading) {
      btn.dataset._originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';
    } else {
      btn.disabled = false;
      btn.textContent = restoreText || btn.dataset._originalText || 'Send Message';
      delete btn.dataset._originalText;
    }
  };

  // ---------------------------
  // Form validation and handling
  // ---------------------------
  document.querySelectorAll('.needs-validation').forEach(form => {
    form.addEventListener('submit', event => {
      // native HTML5 validation first
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        form.classList.add('was-validated');
        return;
      }

      // Contact form: intercept and send to API
      if (form.id === 'contactForm') {
        event.preventDefault();

        const successAlert = document.getElementById('successAlert');
        const errorAlert   = document.getElementById('errorAlert');
        const submitBtn    = form.querySelector('button[type="submit"]');

        // clear any prior state
        hideAlert(successAlert);
        hideAlert(errorAlert);
        setBtnLoading(submitBtn, true);

        // ensure hidden fields exist
        const idemInput   = document.getElementById('idempotency_key');
        const tokenInput  = document.getElementById('recaptcha_token');
        const formTypeEl  = document.getElementById('formType');
        const nameEl      = document.getElementById('name');
        const emailEl     = document.getElementById('email');
        const messageEl   = document.getElementById('message');
        const companyEl   = document.getElementById('company'); // honeypot

        // generate idempotency key for this submit
        const idem = uuid();
        if (idemInput) idemInput.value = idem;

        // function to actually send to API once we have a reCAPTCHA token
        const doSubmit = async (token) => {
          if (tokenInput) tokenInput.value = token || '';

          const payload = {
            formType: formTypeEl?.value || 'contact',
            name:     nameEl?.value?.trim() || '',
            email:    emailEl?.value?.trim() || '',
            message:  messageEl?.value?.trim() || '',
            company:  companyEl?.value || '',            // honeypot
            recaptcha_token: token || ''
          };

          try {
            const res = await fetch(window.CONFIG?.apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-idempotency-key': idem
              },
              body: JSON.stringify(payload)
            });

            const ct   = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json().catch(() => null) : null;

            if (res.ok) {
              // 200/202
              showAlert(successAlert);
              form.reset();
              form.classList.remove('was-validated');
              setTimeout(() => hideAlert(successAlert), 5000);
            } else if (res.status === 400) {
              const err = (data && data.error) ? String(data.error) : 'Bad request';
              if (err === 'recaptcha_failed') {
                showAlert(errorAlert, 'Verification failed. Please try again.');
              } else if (/missing fields/i.test(err)) {
                showAlert(errorAlert, 'Please complete all required fields and try again.');
              } else {
                showAlert(errorAlert, 'Please check your inputs and try again.');
              }
            } else if (res.status === 403 || res.status === 429) {
              showAlert(errorAlert, 'Too many attempts or blocked. Please try again later.');
            } else {
              showAlert(errorAlert, 'Something went wrong on our end. Please try again later.');
            }
          } catch (e) {
            console.error('Network/JS error', e);
            showAlert(errorAlert, 'Network error. Please try again.');
          } finally {
            setBtnLoading(submitBtn, false);
          }
        };

        // request a reCAPTCHA v3 token then submit
        try {
          if (window.grecaptcha && window.CONFIG?.recaptchaSiteKey) {
            window.grecaptcha.ready(() => {
              window.grecaptcha.execute(window.CONFIG.recaptchaSiteKey, { action: 'contact' })
                .then(token => doSubmit(token))
                .catch(err => {
                  console.error('grecaptcha execute error', err);
                  showAlert(errorAlert, 'Verification unavailable. Please try again.');
                  setBtnLoading(submitBtn, false);
                });
            });
          } else {
            showAlert(errorAlert, 'Verification not loaded. Please refresh and try again.');
            setBtnLoading(submitBtn, false);
          }
        } catch (e) {
          console.error('grecaptcha error', e);
          showAlert(errorAlert, 'Verification error. Please try again.');
          setBtnLoading(submitBtn, false);
        }

        // keep validation styles active
        form.classList.add('was-validated');
        return;
      }

      // Non-contact forms (if any) just use native validation
      form.classList.add('was-validated');
    });
  });

  // Active navigation highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href').endsWith(currentPage)) {
      link.classList.add('active');
    }
  });

  // Fade in elements on scroll (Optimized with Intersection Observer)
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing once visible
        }
      });
    }, { threshold: 0.3 });

    fadeElements.forEach(element => observer.observe(element));
  } else {
    // Fallback for older browsers
    const fadeInOnScroll = () => {
      fadeElements.forEach(element => {
        const { top, bottom } = element.getBoundingClientRect();
        if (top < window.innerHeight && bottom >= 0) {
          element.classList.add('visible');
        }
      });
    };
    fadeInOnScroll();
    window.addEventListener('scroll', fadeInOnScroll);
  }
});
