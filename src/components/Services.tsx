'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_SERVICES = [
  {
    id: 1,
    title: "Дизайн-проект",
    desc: "Создаём уникальные интерьеры с учётом ваших пожеланий. 3D-визуализация, планировочные решения, подбор материалов.",
    images: ["/uploads/1764618989423-1__1_.jpeg", "/uploads/1764621861710-1__11_.jpeg"]
  },
  {
    id: 2,
    title: "Ремонт под ключ",
    desc: "Полный цикл работ от демонтажа до финишной отделки. Вы получаете готовую квартиру с мебелью.",
    images: ["/uploads/1764623765908-1__9_.jpeg", "/uploads/1764623768565-1__3_.jpeg"]
  },
  {
    id: 3,
    title: "Капитальный ремонт",
    desc: "Полная перепланировка, замена коммуникаций, электрики и сантехники. Работаем со сложными объектами.",
    images: ["/uploads/1764611922746-1__4_.jpeg", "/uploads/1764611959220-1__5_.jpeg"]
  }
];

const BackgroundSlider = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  // Fallback изображение
  const fallbackImg = "/uploads/1764611922746-1__4_.jpeg";
  const imageList = images && images.length > 0 ? images : [fallbackImg];

  return (
    <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none">
      {imageList.map((img, index) => (
        <div 
          key={index}
          className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === current ? 1 : 0 }}
        >
          <img
            src={img || fallbackImg}
            alt=""
            loading="lazy"
            width={800}
            height={600}
            style={{ minHeight: '100%', minWidth: '100%' }}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallback) {
                target.dataset.fallback = 'true';
                target.src = fallbackImg;
              }
            }}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
};

export default function Services() {
  const [services, setServices] = useState<any[]>(DEFAULT_SERVICES);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => { 
        if(Array.isArray(data) && data.length > 0) {
          setServices(data);
        }
      })
      .catch(() => {});
  }, []);

  const getGridClass = (index: number) => {
    if (index === 0) return 'md:col-span-2 h-[380px]'; 
    return 'md:col-span-1 h-[300px]';
  };

  return (
    <section ref={containerRef} id="services" className="py-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          <div className="lg:w-2/5">
            <div className="sticky top-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-[1px] bg-brand-green"></div>
                <span className="text-brand-green font-bold tracking-widest uppercase text-sm">Экспертиза</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-text-primary mb-8 leading-tight">
                Наши <br/><span className="text-gradient-main">Услуги</span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-sm">
                Полный цикл работ. Мы проектируем, строим и комплектуем объекты любой сложности.
              </p>
              
              <ul className="space-y-4 text-text-secondary font-medium hidden lg:block">
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-brand-green rounded-full"></span> Технический надзор</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-brand-green rounded-full"></span> Закупка материалов</li>
                <li className="flex items-center gap-3"><span className="w-2 h-2 bg-brand-green rounded-full"></span> Гарантия 3 года</li>
              </ul>
            </div>
          </div>

          <div className="lg:w-3/5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <div 
                key={s.id} 
                className={`service-card service-card-hover group relative rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-brand-green shadow-2xl ${getGridClass(i)}`}
              >
                <BackgroundSlider images={s.images || []} />

                <div className="relative z-10 h-full p-8 md:p-10 flex flex-col justify-end">
                  <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                    <h3 className={`font-bold text-white mb-3 drop-shadow-lg ${i === 0 ? 'text-3xl' : 'text-xl'}`}>
                      {s.title}
                    </h3>
                    
                    <div className="w-10 h-1 bg-brand-green mb-3 transform scale-0 group-hover:scale-100 origin-left transition-transform duration-500"></div>
                    
                    <p className="text-gray-100 text-sm font-medium opacity-90 group-hover:opacity-100 leading-relaxed drop-shadow-md">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
