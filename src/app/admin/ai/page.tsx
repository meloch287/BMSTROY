'use client';
import { useState } from 'react';
import { Sparkles, Copy, Layout, Send, FileText } from 'lucide-react';

export default function AdminAI() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('site');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if(!topic) return;
    setLoading(true);
    setResult('');
    
    const res = await fetch('/api/ai/generate', { 
        method: 'POST', 
        body: JSON.stringify({ topic, platform }) 
    });
    const data = await res.json();
    setResult(data.content);
    setLoading(false);

    await fetch('/api/logs', { 
        method: 'POST', 
        body: JSON.stringify({ action: 'AI Генерация', details: `Тема: ${topic}, Платформа: ${platform}`, user: 'Admin' }) 
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">AI Фабрика Контента</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 h-fit">
            <div className="mb-6">
                <label className="text-gray-500 text-sm mb-2 block">О чем писать?</label>
                <input placeholder="Например: Ошибки при ремонте ванной" value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white"/>
            </div>
            
            <div className="mb-6">
                <label className="text-gray-500 text-sm mb-2 block">Платформа</label>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setPlatform('site')} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 ${platform === 'site' ? 'bg-brand-green border-brand-green text-white' : 'border-white/10 text-gray-400'}`}>
                        <Layout size={18}/> Сайт
                    </button>
                    <button onClick={() => setPlatform('telegram')} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 ${platform === 'telegram' ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-gray-400'}`}>
                        <Send size={18}/> TG
                    </button>
                    <button onClick={() => setPlatform('dzen')} className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 ${platform === 'dzen' ? 'bg-black border-white/20 text-white' : 'border-white/10 text-gray-400'}`}>
                        <FileText size={18}/> Дзен
                    </button>
                </div>
            </div>

            <button onClick={generate} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20">
                {loading ? 'Нейросеть думает...' : <><Sparkles size={20}/> Сгенерировать</>}
            </button>
        </div>

        {/* OUTPUT */}
        <div className="lg:col-span-2 bg-[#0F172A] p-8 rounded-2xl border border-white/5 min-h-[400px] relative">
            {result ? (
                <>
                    <button onClick={() => navigator.clipboard.writeText(result)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors" title="Копировать"><Copy size={18}/></button>
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                        {platform === 'site' ? (
                             <div dangerouslySetInnerHTML={{ __html: result }} />
                        ) : (
                             <div className="font-mono text-sm">{result}</div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <Sparkles size={48} className="mb-4 opacity-20"/>
                    <p>Результат появится здесь</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}