'use client';
import { useEffect, useRef } from 'react';

export default function BackgroundBlobs() {
  const blob1 = useRef(null);
  const blob2 = useRef(null);

  useEffect(() => {
    // Lazy load GSAP - this is a non-critical animation
    const init = async () => {
      const { gsap } = await import('gsap');
      
      gsap.to(blob1.current, {
        x: '20vw', y: '20vh', rotate: 360, scale: 1.2,
        duration: 20, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      gsap.to(blob2.current, {
        x: '-20vw', y: '-10vh', rotate: -360, scale: 0.8,
        duration: 25, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
    };

    // Delay significantly as this is purely decorative
    const timer = setTimeout(init, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20 blur-[100px]">
      <div ref={blob1} className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-green rounded-full mix-blend-screen opacity-30"></div>
      <div ref={blob2} className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent rounded-full mix-blend-screen opacity-20"></div>
    </div>
  );
}