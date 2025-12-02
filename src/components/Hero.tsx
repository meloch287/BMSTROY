'use client';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Lazy load GSAP only after initial render to not block LCP
    const loadGsap = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      
      gsap.to('.hero-bg-img', {
        yPercent: 50, ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true }
      });
    };
    
    // Delay GSAP loading to prioritize LCP
    requestIdleCallback ? requestIdleCallback(loadGsap) : setTimeout(loadGsap, 100);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section ref={heroRef} className="relative h-[100svh] w-full flex items-center justify-center overflow-hidden bg-plaster">
      
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-brand-green-light/8 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 text-center mt-10">
        {/* LCP Element - использует системный шрифт как fallback для мгновенного рендеринга */}
        <h1 className="font-logo text-5xl md:text-9xl font-extrabold tracking-tight text-text-primary mb-6 leading-[1.1]">
          БМ<span className="text-gradient-main">СТРОЙ</span>
        </h1>
        
        <p className="text-lg md:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 font-light">
          Инновации. Качество. <span className="text-brand-green-dark font-medium">Технологии.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <button 
             onClick={() => scrollToSection('calculator')}
             className="btn-gradient btn-hover-glow px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_4px_20px_rgba(124,179,66,0.3)]"
           >
             Рассчитать смету
           </button>
           <button 
             onClick={() => scrollToSection('portfolio')}
             className="btn-hover-scale px-10 py-5 border border-brand-green/20 bg-white/60 backdrop-blur-md rounded-2xl font-bold text-text-primary hover:bg-brand-green/10 hover:border-brand-green/50 hover:text-brand-green-dark"
           >
             Портфолио
           </button>
        </div>
      </div>
    </section>
  );
}