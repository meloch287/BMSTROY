export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0.01
): number {
  return prefersReducedMotion() ? reducedDuration : normalDuration;
}

export function getGSAPConfig(config: any) {
  if (prefersReducedMotion()) {
    return {
      ...config,
      duration: 0.01,
      ease: 'none',
    };
  }
  return config;
}

export function onMotionPreferenceChange(callback: (prefersReduced: boolean) => void) {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
}
