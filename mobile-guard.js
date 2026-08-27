(() => {
  const prevent = e => e.preventDefault();

  // iOS Safari gesture events
  ['gesturestart','gesturechange','gestureend'].forEach(type => {
    document.addEventListener(type, prevent, { passive: false });
  });

  // Multi-touch pinch on mobile browsers
  document.addEventListener('touchmove', e => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Prevent double-tap zoom while preserving normal taps/scrolling
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();
