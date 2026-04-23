// ---------------------------------------------------------------------------
// StoneTracker — waitlist form handler + language switcher
// ---------------------------------------------------------------------------

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgvPWqMrbaVXlMCyyhyqIQ8eR_NxnL6y5tO_HR16VkkmirJdSZU380muLCDNXcjWw/exec';

// ---------------------------------------------------------------------------
// Copy — EN and NL
// ---------------------------------------------------------------------------
var COPY = {
  en: {
    title:      'StoneTracker \u2014 Dutch Housing Price Tracker',
    metaDesc:   'Track listing prices for rentals and homes for sale in Amsterdam and Haarlem. See which prices are dropping, which listings are new, and which are quietly relisted.',
    htmlLang:   'en',
    eyebrow:    'Amsterdam \u0026 Haarlem \u00B7 Early access',
    h1:         'Stop overpaying. See the drop before anyone else.',
    subhead:    'We track listing prices for rentals and homes for sale across Amsterdam and Haarlem \u2014 expanding across the Randstad. Know if a listing dropped \u20AC20K last month before you make an offer.',
    feat1:      '<strong>Full price history</strong> \u2014 know exactly when a price dropped and by how much, before you walk through the door.',
    feat2:      '<strong>Relist detection</strong> \u2014 see listings that were pulled and put back, sometimes at a suspiciously \u201Cnew\u201D price.',
    feat3:      '<strong>Daily tracking</strong> \u2014 get alerted the moment a price drops or a listing you\u2019re watching comes back.',
    label:      'Email address',
    btn:        'Get early access',
    emailError: 'Please enter a valid email address.',
    success:    "You\u2019re on the list. We\u2019ll email you when we launch.",
    footer:     'Built in Amsterdam.',
  },
  nl: {
    title:      'StoneTracker \u2014 Volg Nederlandse huizenprijzen',
    metaDesc:   'Volg vraagprijzen van huurwoningen en koopwoningen in Amsterdam en Haarlem. Zie welke prijzen dalen, welke woningen echt nieuw zijn en welke stilletjes herplaatst zijn.',
    htmlLang:   'nl',
    eyebrow:    'Amsterdam \u0026 Haarlem \u00B7 registreer nu',
    h1:         'Stop met overbieden. Zie de daling als eerste.',
    subhead:    'We volgen vraagprijzen van huurwoningen en koopwoningen in Amsterdam en Haarlem \u2014 en breiden uit naar de rest van de Randstad. Weet of een woning vorige maand \u20AC20.000 goedkoper stond, voordat je een bod uitbrengt.',
    feat1:      '<strong>Volledige prijsgeschiedenis</strong> \u2014 weet precies wanneer een prijs daalde en met hoeveel, voordat je de woning bezichtigt.',
    feat2:      '<strong>Herplaatsing detectie</strong> \u2014 zie woningen die van de markt gehaald en stilletjes teruggeplaatst zijn, soms met een \u2018nieuwe\u2019 vraagprijs.',
    feat3:      '<strong>Dagelijkse monitoring</strong> \u2014 ontvang direct een melding wanneer een prijs daalt of een woning die je volgt weer beschikbaar komt.',
    label:      'E-mailadres',
    btn:        'Registreer nu',
    emailError: 'Vul een geldig e-mailadres in.',
    success:    'Je staat op de lijst. We e-mailen je zodra we live gaan.',
    footer:     'Gebouwd in Amsterdam.',
  },
};

// ---------------------------------------------------------------------------
// Theme (dark / light)
// ---------------------------------------------------------------------------
var currentTheme = (function () {
  var saved = localStorage.getItem('stonetracker-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
})();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var btn = document.getElementById('theme-btn');
  if (btn) {
    btn.textContent = theme === 'dark' ? '\u2600' : '\u263E'; // ☀ in dark, ☾ in light
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  localStorage.setItem('stonetracker-theme', theme);
  currentTheme = theme;
}

// ---------------------------------------------------------------------------
// Language switcher
// ---------------------------------------------------------------------------
var currentLang = navigator.language.startsWith('nl') ? 'nl' : 'en';

function applyLanguage(lang) {
  var c = COPY[lang];
  document.documentElement.lang                                         = c.htmlLang;
  document.title                                                        = c.title;
  document.querySelector('meta[name="description"]').setAttribute('content', c.metaDesc);
  document.querySelector('.eyebrow').textContent                        = c.eyebrow;
  document.querySelector('h1').textContent                              = c.h1;
  document.querySelector('.subhead').textContent                        = c.subhead;
  document.getElementById('feat-1').innerHTML                           = c.feat1;
  document.getElementById('feat-2').innerHTML                           = c.feat2;
  document.getElementById('feat-3').innerHTML                           = c.feat3;
  document.querySelector('label[for="email-input"]').textContent        = c.label;
  document.getElementById('submit-btn').textContent                     = c.btn;
  document.getElementById('footer-tagline').textContent                 = c.footer;

  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-nl').classList.toggle('active', lang === 'nl');

  currentLang = lang;
}

// ---------------------------------------------------------------------------
// Form handler
// ---------------------------------------------------------------------------
(function () {
  applyTheme(currentTheme);
  applyLanguage(currentLang);

  document.getElementById('theme-btn').addEventListener('click', function () {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
  document.getElementById('lang-en').addEventListener('click', function () { applyLanguage('en'); });
  document.getElementById('lang-nl').addEventListener('click', function () { applyLanguage('nl'); });

  var form   = document.getElementById('waitlist-form');
  var input  = document.getElementById('email-input');
  var button = document.getElementById('submit-btn');
  var status = document.getElementById('form-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = input.value.trim();

    if (!isValidEmail(email)) {
      setStatus('error', COPY[currentLang].emailError);
      input.focus();
      return;
    }

    setStatus('success', COPY[currentLang].success);
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
        console.error('[StoneTracker] Waitlist submission failed for', email, '\u2014', err.message);
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
