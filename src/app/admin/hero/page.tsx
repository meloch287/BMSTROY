'use client';
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function AdminHero() {
  const [hero, setHero] = useState({
    title: '',
    subtitle: '',
    bg: ''
  });

  useEffect(() => {
    fetch('/api/content?type=hero').then(res => res.json()).then(setHero);
  }, []);

  const handleSave = async () => {
    await fetch('/api/content', {
        method: 'POST',
        body: JSON.stringify({ type: 'hero', data: hero })
    });
    alert('Главный экран обновлен!');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Редактор Главного Экрана</h1>
        <button onClick={handleSave} className="bg-brand-green hover:bg-brand-green-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg">
            <Save size={20}/> Сохранить
        </button>
      </div>

      <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 space-y-6 max-w-3xl">
        <div>
            <label className="block text-gray-500 text-sm mb-2">Заголовок (H1)</label>
            <input value={hero.title} onChange={e => setHero({...hero, title: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-4 rounded-xl text-white font-bold text-xl"/>
            <p className="text-xs text-gray-600 mt-1">Можно использовать HTML теги, например &lt;span&gt;</p>
        </div>
        <div>
            <label className="block text-gray-500 text-sm mb-2">Подзаголовок</label>
            <input value={hero.subtitle} onChange={e => setHero({...hero, subtitle: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-4 rounded-xl text-white"/>
        </div>
        <div>
            <label className="block text-gray-500 text-sm mb-2">Ссылка на фоновое изображение</label>
            <input value={hero.bg} onChange={e => setHero({...hero, bg: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-4 rounded-xl text-white text-sm font-mono"/>
            {hero.bg && <img src={hero.bg} className="mt-4 w-full h-48 object-cover rounded-xl border border-white/10" alt="Preview"/>}
        </div>
      </div>
    </div>
  );
}