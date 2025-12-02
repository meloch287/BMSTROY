'use client';
import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Lazy load GSAP to not block initial render
    const loadGsap = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const progressBar = document.getElementById('progress-bar');
      if (!progressBar) return;

      progressBar.style.width = '0%';

      gsap.to(progressBar, {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
          invalidateOnRefresh: true,
        }
      });

      cleanupRef.current = () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    };

    // Delay loading to prioritize LCP
    const timer = setTimeout(loadGsap, 200);

    return () => {
      clearTimeout(timer);
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-gray-300/30">
       <div 
         id="progress-bar" 
         className="h-full bg-brand-green shadow-[0_0_10px_rgba(124,179,66,0.6)]" 
         style={{ width: '0%' }}
       ></div>
    </div>
  );
}