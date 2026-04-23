// ---------------------------------------------------------------------------
// StoneTracker — waitlist form handler
//
// Replace APPS_SCRIPT_URL with the Web App URL from `clasp deploy`.
// When you have a custom domain, also update the referrer logic below if
// you want to distinguish traffic sources.
// ---------------------------------------------------------------------------

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgvPWqMrbaVXlMCyyhyqIQ8eR_NxnL6y5tO_HR16VkkmirJdSZU380muLCDNXcjWw/exec';

(function () {
  var form   = document.getElementById('waitlist-form');
  var input  = document.getElementById('email-input');
  var button = document.getElementById('submit-btn');
  var status = document.getElementById('form-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = input.value.trim();

    // Client-side email validation before hitting the network.
    if (!isValidEmail(email)) {
      setStatus('error', 'Please enter a valid email address.');
      input.focus();
      return;
    }

    setStatus('', '');
    button.disabled = true;
    button.textContent = 'Joining…';

    var payload = JSON.stringify({
      email:      email,
      user_agent: navigator.userAgent,
      referrer:   document.referrer,
      // We hash the IP server-side from the request headers.
      // ip_hash is sent as empty string here; Apps Script computes it.
      ip_hash:    '',
    });

    // POST as text/plain to avoid a CORS preflight against the Apps Script
    // endpoint, which does not support OPTIONS responses.
    fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    payload,
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.ok) {
          setStatus('success', "You're on the list. We'll email you when we launch.");
          form.reset();
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      })
      .catch(function (err) {
        console.error('Waitlist error:', err);
        setStatus(
          'error',
          'Something went wrong. Please try again or email us directly.'
        );
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = 'Join the waitlist';
      });
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setStatus(type, message) {
    status.textContent = message;
    status.className   = 'form-status' + (type ? ' ' + type : '');
  }
})();
