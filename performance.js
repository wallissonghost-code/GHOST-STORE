(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero-tech');
  let heroVisible = true;

  function syncMotionState(){
    const shouldPause = document.hidden || !heroVisible;
    root.classList.toggle('motion-paused', shouldPause);
  }

  document.addEventListener('visibilitychange', syncMotionState, { passive:true });

  if ('IntersectionObserver' in window && hero) {
    const observer = new IntersectionObserver(entries => {
      heroVisible = entries.some(entry => entry.isIntersecting);
      syncMotionState();
    }, { rootMargin:'120px 0px', threshold:0.01 });
    observer.observe(hero);
  }

  syncMotionState();
})();
