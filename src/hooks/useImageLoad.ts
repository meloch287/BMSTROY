import { useState, useEffect, RefObject } from 'react';

export function useImageLoad(imageRef: RefObject<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    if (img.complete) {
      setLoaded(true);
      return;
    }

    const handleLoad = () => setLoaded(true);
    const handleError = () => setLoaded(true); // Still show image on error

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [imageRef]);

  return loaded;
}

export function useLazyLoad(elementRef: RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return isVisible;
}
