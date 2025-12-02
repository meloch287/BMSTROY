'use client';
import { useState, useEffect } from 'react';
import { Menu, Phone, MessageCircle, ChevronDown, Home } from 'lucide-react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MENU_ITEMS = [
  { label: 'Главная', href: '/', isPage: true },
  { label: 'Услуги', href: '/#services', submenu: ['Капитальный ремонт', 'Косметический ремонт', 'Дизайнерский ремонт'] },
  { label: 'Портфолио', href: '/#portfolio' },
  { label: 'Цены', href: '/#calculator' },
  { label: 'Акции', href: '/#promos' },
  { label: 'Отзывы', href: '/#reviews' },
  { label: 'Блог', href: '/blog', isPage: true },
  { label: 'Контакты', href: '/contacts', isPage: true },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        gsap.to('#mobile-menu-bg', { opacity: 1, duration: 0.3 });
        gsap.to('#mobile-menu-content', { y: 0, duration: 0.4, ease: 'power3.out' });
    } else {
        document.body.style.overflow = '';
        gsap.to('#mobile-menu-bg', { opacity: 0, duration: 0.3 });
        gsap.to('#mobile-menu-content', { y: '100%', duration: 0.3, ease: 'power3.in' });
    }
  }, [isOpen]);

  const handleNavClick = (href: string, isPage?: boolean) => {
    setIsOpen(false);
    
    if (isPage) {
      router.push(href);
      return;
    }
    
    // Если это якорная ссылка
    if (href.includes('#')) {
      const hash = href.split('#')[1];
      if (isHomePage) {
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        router.push(href);
      }
    }
  };

  const handleCalculatorClick = () => {
    if (isHomePage) {
      document.getElementById('calculator')?.scrollIntoView({behavior: 'smooth'});
    } else {
      router.push('/#calculator');
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-plaster/95 backdrop-blur-lg border-t border-gray-300 p-4 flex items-center gap-3 pb-8">
        {!isHomePage && (
          <Link 
            href="/"
            className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-text-primary border border-gray-300"
          >
            <Home size={20} />
          </Link>
        )}
        <button 
            onClick={handleCalculatorClick}
            className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-green/20 flex items-center justify-center"
        >
            Рассчитать смету
        </button>
        <button 
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-text-primary border border-gray-300"
        >
            <Menu />
        </button>
      </div>

      <div 
        id="mobile-menu-bg" 
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm opacity-0 pointer-events-none" 
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={() => setIsOpen(false)}
      />
      
      <div 
        id="mobile-menu-content"
        className="fixed bottom-0 left-0 w-full bg-white z-[70] rounded-t-[2rem] border-t border-gray-300 transform translate-y-full shadow-2xl max-h-[85vh] overflow-y-auto"
      >
         <div className="p-6">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            
            <nav className="space-y-2 mb-8">
              {MENU_ITEMS.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => item.submenu ? setExpandedItem(expandedItem === item.label ? null : item.label) : handleNavClick(item.href, item.isPage)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl font-semibold transition-colors ${
                      pathname === item.href 
                        ? 'bg-brand-green/20 text-brand-green' 
                        : 'bg-gray-50 text-text-primary hover:bg-brand-green/10'
                    }`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown className={`transition-transform ${expandedItem === item.label ? 'rotate-180' : ''}`} size={20} />}
                  </button>
                  {item.submenu && expandedItem === item.label && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.submenu.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => handleNavClick(item.href, item.isPage)}
                          className="w-full text-left p-3 text-text-secondary hover:text-brand-green transition-colors"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="space-y-3">
                <a href="tel:+79990000000" className="flex items-center gap-4 p-4 bg-brand-green/10 rounded-xl text-text-primary hover:bg-brand-green/20 transition-colors">
                    <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white"><Phone size={20}/></div>
                    <span className="font-bold">+7 (999) 000-00-00</span>
                </a>
                <a href="https://wa.me/79990000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-green-500/10 rounded-xl text-text-primary hover:bg-green-500/20 transition-colors">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"><MessageCircle size={20}/></div>
                    <span className="font-bold">WhatsApp</span>
                </a>
                <a href="https://t.me/bmstroy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-blue-500/10 rounded-xl text-text-primary hover:bg-blue-500/20 transition-colors">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">✈️</div>
                    <span className="font-bold">Telegram</span>
                </a>
            </div>

            <button onClick={() => setIsOpen(false)} className="mt-6 w-full py-4 bg-gray-100 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors">Закрыть меню</button>
         </div>
      </div>
    </>
  );
}