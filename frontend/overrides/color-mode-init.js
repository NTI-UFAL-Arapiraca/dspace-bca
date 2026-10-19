// Run before styles and Angular so a saved dark theme never starts in light mode.
(function () {
  var mode = 'light';
  try {
    if (localStorage.getItem('ufal.color-mode') === 'dark') mode = 'dark';
  } catch (_) {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
  document.documentElement.setAttribute('data-bs-theme', mode);
})();
