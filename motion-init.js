// Apply the visitor's motion preference before the first paint.
(function () {
  document.documentElement.classList.add("js");
  try {
    var preference = localStorage.getItem("sync-site-motion");
    if (preference === "paused" || (!preference && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      document.documentElement.classList.add("motion-paused");
    }
  } catch (_) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("motion-paused");
  }
})();
