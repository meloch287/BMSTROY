'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          <h1 className="text-[100px] sm:text-[120px] font-black text-red-500 leading-none mb-2">
            Ошибка
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Что-то пошло не так
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Произошла непредвиденная ошибка. Наши специалисты уже работают над её устранением.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-8 py-4 bg-brand-green text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
            >
              Попробовать снова
            </button>
            <Link 
              href="/" 
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
            >
              На главную
            </Link>
          </div>
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
