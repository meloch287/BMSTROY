'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/utils/accessibility';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  { num: '01', title: 'Заявка', desc: 'Оставьте заявку на сайте или позвоните. Менеджер свяжется в течение 15 минут.', icon: '📝' },
  { num: '02', title: 'Замер', desc: 'Бесплатный выезд специалиста. Точные замеры и составление сметы на месте.', icon: '📐' },
  { num: '03', title: 'Договор', desc: 'Фиксируем стоимость и сроки в договоре. Цена не меняется в процессе работ.', icon: '📋' },
  { num: '04', title: 'Сдача', desc: 'Выполняем ремонт точно в срок. Сдаём объект с гарантией 2 года.', icon: '🏠' },
];

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !lineRef.current) return;

    const line = lineRef.current;

    if (prefersReducedMotion()) {
      line.style.height = '100%';
      return;
    }

    gsap.fromTo(
      line,
      { height: '0%' },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);
  return (
    <section id="steps" className="py-24 relative z-10 bg-plaster-light">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-16 text-center text-text-primary">Этапы <span className="text-brand-green">работы</span></h2>

        <div ref={containerRef} className="relative max-w-4xl mx-auto">
          {/* Линия таймлайна - мобильная */}
          <div className="md:hidden absolute left-[23px] top-6 bottom-6 w-[3px] bg-brand-green/20"></div>
          <div 
            ref={lineRef}
            className="md:hidden absolute left-[23px] top-6 w-[3px] bg-brand-green shadow-[0_0_10px_rgba(124,179,66,0.5)]"
            style={{ height: '0%' }}
          ></div>
          
          {/* Линия таймлайна - десктоп */}
          <div className="hidden md:block absolute left-1/2 top-7 bottom-7 w-[3px] bg-brand-green/20 -translate-x-1/2"></div>
          <div 
            className="hidden md:block absolute left-1/2 top-7 w-[3px] bg-brand-green -translate-x-1/2 shadow-[0_0_10px_rgba(124,179,66,0.5)]"
            style={{ height: 'calc(100% - 56px)' }}
          ></div>

          <div className="space-y-16 md:space-y-20">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {/* Мобильная версия */}
                <div className="md:hidden flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                      {step.num}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-bold mb-2 text-text-primary">{step.title}</h3>
                    <p className="text-text-secondary text-sm">{step.desc}</p>
                  </div>
                </div>

                {/* Десктопная версия */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:items-center">
                  {/* Левая колонка */}
                  <div className={`${i % 2 === 0 ? 'text-right pr-8' : 'order-3 pl-8'}`}>
                    {i % 2 === 0 ? (
                      <>
                        <h3 className="text-2xl font-bold mb-2 text-text-primary">{step.title}</h3>
                        <p className="text-text-secondary">{step.desc}</p>
                      </>
                    ) : null}
                    {i % 2 !== 0 ? (
                      <>
                        <h3 className="text-2xl font-bold mb-2 text-text-primary">{step.title}</h3>
                        <p className="text-text-secondary">{step.desc}</p>
                      </>
                    ) : null}
                  </div>

                  {/* Центральный круг */}
                  <div className="w-14 h-14 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10 order-2">
                    {step.num}
                  </div>

                  {/* Правая колонка (пустая для баланса) */}
                  <div className={`${i % 2 === 0 ? 'order-3' : ''}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}