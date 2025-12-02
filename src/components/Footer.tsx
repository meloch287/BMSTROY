'use client';
import { useEffect, useRef, useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const STATS = [
    { num: 150, label: 'Проектов сдано', suffix: '+' },
    { num: 8, label: 'Лет опыта', suffix: '' },
    { num: 98, label: 'Довольных клиентов', suffix: '%' },
];

export default function Footer() {
  const containerRef = useRef(null);
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0]);
  const hasAnimated = useRef(false);
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          STATS.forEach((stat, index) => {
            let start = 0;
            const end = stat.num;
            const duration = 2000;
            const increment = end / (duration / 16);
            
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                start = end;
                clearInterval(timer);
              }
              setAnimatedStats(prev => {
                const newStats = [...prev];
                newStats[index] = Math.floor(start);
                return newStats;
              });
            }, 16);
          });
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="bg-plaster-dark text-text-primary pt-24 pb-12 border-t border-gray-300">
      <div className="container mx-auto px-4" ref={containerRef}>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 border-b border-gray-300 pb-12">
            {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                    <div className="text-5xl md:text-7xl font-bold text-text-primary mb-2 font-mono">
                        {animatedStats[i]}{stat.suffix}
                    </div>
                    <div className="text-brand-green uppercase tracking-widest text-sm font-bold">{stat.label}</div>
                </div>
            ))}
        </div>

        <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
                <div className="text-2xl font-bold mb-6">БМ<span className="text-brand-green">Строй</span></div>
                <p className="text-text-secondary text-sm leading-relaxed">Премиальный ремонт квартир в Москве. Создаем пространства, в которых хочется жить.</p>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-lg">Услуги</h4>
                <ul className="space-y-3 text-sm text-text-secondary">
                    <li><a href="#services" className="hover:text-brand-green transition-colors">Дизайн-проект</a></li>
                    <li><a href="#services" className="hover:text-brand-green transition-colors">Ремонт под ключ</a></li>
                    <li><a href="#calculator" className="hover:text-brand-green transition-colors">Калькулятор</a></li>
                    <li><a href="#portfolio" className="hover:text-brand-green transition-colors">Портфолио</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-lg">Компания</h4>
                <ul className="space-y-3 text-sm text-text-secondary">
                    <li><a href="#team" className="hover:text-brand-green transition-colors">Команда</a></li>
                    <li><a href="#reviews" className="hover:text-brand-green transition-colors">Отзывы</a></li>
                    <li><a href="#steps" className="hover:text-brand-green transition-colors">Этапы работы</a></li>
                    <li><a href="#promos" className="hover:text-brand-green transition-colors">Акции</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-lg">Контакты</h4>
                <div className="space-y-4">
                    {isLoading ? (
                      <>
                        <div className="flex items-center gap-3"><Phone size={18} className="text-gray-300" /><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></div>
                        <div className="flex items-center gap-3"><Mail size={18} className="text-gray-300" /><div className="h-4 w-36 bg-gray-200 rounded animate-pulse" /></div>
                        <div className="flex items-center gap-3"><MapPin size={18} className="text-gray-300" /><div className="h-4 w-48 bg-gray-200 rounded animate-pulse" /></div>
                      </>
                    ) : (
                      <>
                        <a href={`tel:${settings?.phone?.replace(/\D/g, '') || ''}`} className="flex items-center gap-3 text-text-secondary hover:text-brand-green transition-colors">
                            <Phone size={18} /> {settings?.phone}
                        </a>
                        <a href={`mailto:${settings?.email || ''}`} className="flex items-center gap-3 text-text-secondary hover:text-brand-green transition-colors">
                            <Mail size={18} /> {settings?.email}
                        </a>
                        <div className="flex items-center gap-3 text-text-secondary">
                            <MapPin size={18} /> {settings?.address}
                        </div>
                      </>
                    )}
                </div>
                <div className="flex gap-3 mt-6">
                    <a href={`https://wa.me/${settings?.phone?.replace(/\D/g, '') || ''}`} target="_blank" rel="noopener" aria-label="Написать в WhatsApp" className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </a>
                    <a href="https://t.me/bmstroy" target="_blank" rel="noopener" aria-label="Написать в Telegram" className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
        
        <div className="text-center text-xs text-gray-600 pt-8 border-t border-white/5">
            © 2025 БМСтрой. Все права защищены.
        </div>
      </div>
    </footer>
  );
}