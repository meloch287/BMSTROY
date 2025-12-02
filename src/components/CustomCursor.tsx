'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.2, ease: "power2.out" });
    };

    const hoverLinks = document.querySelectorAll('a, button, input, select, textarea, .cursor-pointer');
    
    hoverLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        gsap.to(follower, { scale: 2.5, backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: 'transparent' });
      });
      link.addEventListener('mouseleave', () => {
        gsap.to(follower, { scale: 1, backgroundColor: 'transparent', borderColor: '#22c55e' });
      });
    });

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-brand-green rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block shadow-[0_0_10px_#22c55e]" 
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-10 h-10 border border-brand-green rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 hidden md:block transition-colors duration-300" 
      />
    </>
  );
}