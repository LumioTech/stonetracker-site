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

    // Optimistic UI: show success immediately after client-side validation.
    // The POST fires in the background — Apps Script cold-start latency is
    // invisible to the user this way.
    setStatus('success', "You're on the list. We'll email you when we launch.");
    form.reset();
    button.disabled = true;

    var payload = JSON.stringify({
      email:      email,
      user_agent: navigator.userAgent,
      referrer:   document.referrer,
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
        if (!data.ok) throw new Error(data.error || 'ok:false');
      })
      .catch(function (err) {
        // Background POST failed — user already saw success, don't change that.
        // Check the Apps Script Executions log for details.
        console.error('[StoneTracker] Waitlist submission failed for', email, '—', err.message);
      })
      .finally(function () {
        button.disabled = false;
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
