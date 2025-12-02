'use client';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ScrollProgress() {
  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
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