'use client';
import { useState, useEffect } from 'react';
import { Lock, Calendar, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ClientPortal() {
  const params = useParams();
  const uuid = params.uuid as string;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients?uuid=${uuid}`)
        .then(res => res.json())
        .then(data => {
            if (!data.error) setClient(data);
            setLoading(false);
        });
  }, [uuid]);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Загрузка защищенного соединения...</div>;
  if (!client) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-red-500">Доступ запрещен</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-20">
      <header className="bg-[#0F172A] border-b border-white/5 py-6 px-4 md:px-8 flex justify-between items-center">
         <div className="font-bold text-xl">БМ<span className="text-brand-green">Кабинет</span></div>
         <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs border border-green-500/20">
            <Lock size={12}/> Безопасное соединение
         </div>
      </header>

      <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl md:text-4xl font-bold mb-2">Привет, {client.name} 👋</h1>
         <p className="text-gray-400 mb-8">Ход работ по объекту: <span className="text-white font-bold">{client.project}</span></p>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
                <div className="text-gray-500 text-sm mb-2 flex items-center gap-2"><TrendingUp size={16}/> Готовность</div>
                <div className="text-4xl font-bold text-white mb-4">{client.progress || 0}%</div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green transition-all" style={{ width: `${client.progress || 0}%` }}></div>
                </div>
            </div>
            {client.currentStage && (
              <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
                  <div className="text-gray-500 text-sm mb-2 flex items-center gap-2"><Calendar size={16}/> Этап работ</div>
                  <div className="text-2xl font-bold text-white">{client.currentStage}</div>
                  <div className="text-green-500 text-sm mt-2">В работе</div>
              </div>
            )}
         </div>

         <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="text-brand-green"/> Фотоотчеты</h2>
         <div className="space-y-6">
            {client.reports && client.reports.length > 0 ? client.reports.map((rep: any, i: number) => (
                <div key={i} className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between mb-4">
                        <div className="font-bold text-lg">{rep.title}</div>
                        <div className="text-gray-500 text-sm">{new Date(rep.date).toLocaleDateString()}</div>
                    </div>
                    <p className="text-gray-400 mb-4">{rep.comment}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {rep.photos && rep.photos.map((img: string, idx: number) => (
                            <img key={idx} src={img} className="rounded-xl w-full h-32 object-cover border border-white/10" alt=""/>
                        ))}
                    </div>
                </div>
            )) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-gray-500">
                    Пока нет отчетов. Прораб скоро добавит первые фото.
                </div>
            )}
         </div>
      </div>
    </div>
  );
}