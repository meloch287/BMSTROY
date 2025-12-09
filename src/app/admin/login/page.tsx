'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [pass, setPass] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === 'admin123') {
        document.cookie = 'admin_token=secret; path=/';
        router.push('/admin/dashboard');
    } else {
        alert('Неверный пароль');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-[#0F172A] p-12 rounded-3xl border border-white/10 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-green">
            <Lock size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-6">Вход в Админку</h1>
        <input 
            type="password" 
            placeholder="Пароль (admin123)" 
            className="w-full p-4 bg-[#020617] border border-white/10 rounded-xl text-white mb-4 focus:border-brand-green outline-none"
            value={pass}
            onChange={e => setPass(e.target.value)}
        />
        <button className="w-full bg-brand-green text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-colors">
            Войти
        </button>
      </form>
    </div>
  );
}