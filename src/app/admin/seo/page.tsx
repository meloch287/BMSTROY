'use client';
import { useState, useEffect } from 'react';
import { Save, Globe } from 'lucide-react';

export default function AdminSEO() {
  const [seo, setSeo] = useState({ title: '', desc: '' });

  useEffect(() => {
    fetch('/api/seo').then(res => res.json()).then(setSeo);
  }, []);

  const saveSEO = async () => {
    await fetch('/api/seo', { method: 'POST', body: JSON.stringify(seo) });
    alert('SEO настройки обновлены!');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">SEO Настройки</h1>
      <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 max-w-2xl">
         <div className="flex items-center gap-4 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Globe className="text-blue-400" />
            <div className="text-sm text-blue-200">Эти настройки меняют то, как сайт выглядит в поиске Google и Яндекс.</div>
         </div>

         <div className="space-y-6">
            <div>
                <label className="text-gray-500 text-sm mb-1 block">Meta Title (Заголовок вкладки)</label>
                <input value={seo.title} onChange={e => setSeo({...seo, title: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-4 rounded-xl text-white"/>
            </div>
            <div>
                <label className="text-gray-500 text-sm mb-1 block">Meta Description (Описание в поиске)</label>
                <textarea value={seo.desc} onChange={e => setSeo({...seo, desc: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-4 rounded-xl text-white h-32 resize-none"/>
            </div>
            <button onClick={saveSEO} className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
                <Save size={20}/> Сохранить SEO
            </button>
         </div>
      </div>
    </div>
  );
}