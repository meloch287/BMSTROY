import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo size="md" />
          <a href="tel:+78888888888" className="text-gray-400 hover:text-white transition-colors text-sm hidden sm:block">
            +7 (888) 888-88-88
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h1 className="text-[120px] sm:text-[150px] font-black text-brand-green leading-none mb-2">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Страница не найдена
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Похоже, эта страница находится в стадии ремонта или была снесена. 
            Не волнуйтесь, фундамент нашего сайта по-прежнему крепок.
          </p>
          <Link 
            href="/" 
            className="inline-block px-8 py-4 bg-brand-green text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-white/5">
        <p className="text-gray-500 text-sm">
          © 2025 БМСТРОЙ МАСТЕР. Все права защищены.
        </p>
      </footer>
    </div>
  );
}
