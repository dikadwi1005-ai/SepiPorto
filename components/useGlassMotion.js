'use client';

import { useEffect } from 'react';

// Update CSS variables once per frame; cursor movement never re-renders React.
export default function useGlassMotion(scope, enabled) {
  useEffect(() => {
    const root = scope.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let frame;
    let point = null;
    let surface = null;
    let bounds = null;

    function clearSurface() {
      surface?.style.removeProperty('--tilt-x');
      surface?.style.removeProperty('--tilt-y');
      surface = null;
      bounds = null;
    }
    function reset() {
      point = null;
      clearSurface();
      root.style.removeProperty('--pointer-x');
      root.style.removeProperty('--pointer-y');
      root.style.removeProperty('--scene-scroll');
    }
    function render() {
      frame = null;
      if (!enabled || reduced.matches || document.hidden) { reset(); return; }
      root.style.setProperty('--scene-scroll', Math.min(scrollY * .08, 120) + 'px');
      if (!point || !fine.matches) return;
      root.style.setProperty('--pointer-x', (point.x / innerWidth - .5).toFixed(3));
      root.style.setProperty('--pointer-y', (point.y / innerHeight - .5).toFixed(3));
      if (surface && bounds) {
        const x = Math.max(-.5, Math.min(.5, (point.x - bounds.left) / bounds.width - .5));
        const y = Math.max(-.5, Math.min(.5, (point.y - bounds.top) / bounds.height - .5));
        surface.style.setProperty('--tilt-x', (-y * 6).toFixed(2) + 'deg');
        surface.style.setProperty('--tilt-y', (x * 7).toFixed(2) + 'deg');
      }
    }
    function schedule() { if (frame == null) frame = requestAnimationFrame(render); }
    function move(event) {
      if (!enabled || reduced.matches || !fine.matches || event.pointerType === 'touch') return;
      const next = event.target.closest('[data-glass-tilt]');
      if (next !== surface) {
        clearSurface();
        surface = next;
        bounds = next?.getBoundingClientRect() || null;
      }
      point = { x: event.clientX, y: event.clientY };
      schedule();
    }
    function leave() { reset(); }
    function scroll() { clearSurface(); schedule(); }
    function visibility() { root.classList.toggle('tab-asleep', document.hidden); schedule(); }

    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave);
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', leave);
    reduced.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', visibility);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      removeEventListener('scroll', scroll);
      removeEventListener('resize', leave);
      reduced.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', visibility);
      root.classList.remove('tab-asleep');
      reset();
    };
  }, [scope, enabled]);
}
