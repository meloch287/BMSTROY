'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { ChevronDown } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const MENU_ITEMS = [
  {
    label: 'Услуги',
    href: '/#services',
    submenu: [
      { label: 'Капитальный ремонт', href: '/#services' },
      { label: 'Косметический ремонт', href: '/#services' },
      { label: 'Дизайнерский ремонт', href: '/#services' },
      { label: 'Ремонт под ключ', href: '/#services' },
    ]
  },
  { label: 'Портфолио', href: '/#portfolio' },
  { label: 'Цены', href: '/#calculator' },
  {
    label: 'О компании',
    href: '/#about',
    submenu: [
      { label: 'Наша команда', href: '/#team' },
      { label: 'Этапы работы', href: '/#steps' },
      { label: 'Отзывы', href: '/#reviews' },
    ]
  },
  { label: 'Акции', href: '/#promos' },
  { label: 'Блог', href: '/blog' },
  { label: 'Контакты', href: '/contacts' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { settings, isLoading } = useSettings();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getHref = (href: string) => {
    if (href.startsWith('/#') && isHomePage) {
      return href.replace('/', '');
    }
    return href;
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-[90] transition-all duration-500 ${
        scrolled 
          ? 'py-3 bg-plaster/95 backdrop-blur-sm border-b border-gray-300 shadow-sm' 
          : 'py-6 bg-plaster/80'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Logo variant="icon" size="md" />
        
        <nav className="hidden lg:flex gap-6 text-sm font-medium text-text-secondary">
          {MENU_ITEMS.map((item) => (
            <div 
              key={item.label}
              className="relative group"
              onMouseEnter={() => item.submenu && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link 
                href={getHref(item.href)} 
                className={`flex items-center gap-1 hover:text-brand-green transition-colors py-2 ${
                  pathname === item.href || (item.href === '/blog' && pathname.startsWith('/blog')) 
                    ? 'text-brand-green font-bold' 
                    : ''
                }`}
              >
                {item.label}
                {item.submenu && <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />}
              </Link>
              
              {item.submenu && (
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${
                  openDropdown === item.label ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}>
                  <div className="bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px]">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.label}
                        href={getHref(sub.href)}
                        className="block px-4 py-2 text-text-secondary hover:bg-brand-green/10 hover:text-brand-green transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {isLoading ? (
          <div className="hidden md:inline-block px-6 py-3">
            <div className="h-5 w-36 bg-gray-200 rounded-full animate-pulse" />
          </div>
        ) : (
          <a 
            href={`tel:${settings?.phone?.replace(/\D/g, '') || ''}`}
            className="hidden md:inline-block btn-glass px-6 py-3 rounded-full text-sm font-bold hover:bg-brand-green hover:text-white transition-all"
          >
            {settings?.phone}
          </a>
        )}
      </div>
    </header>
  );
}