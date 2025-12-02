import { getCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const leads = getCollection('leads');
  
  const today = new Date().toISOString().split('T')[0];
  const newToday = leads.filter((l: any) => l.createdAt.startsWith(today)).length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Живой Дашборд</h1>
      
      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <div className="text-gray-400 text-sm mb-2">Всего заявок</div>
            <div className="text-4xl font-bold text-white">{leads.length}</div>
            <div className="text-green-500 text-xs mt-2">База: data/leads.json</div>
        </div>
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <div className="text-gray-400 text-sm mb-2">Новых сегодня</div>
            <div className="text-4xl font-bold text-white">{newToday}</div>
        </div>
      </div>

      {/* Real Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 font-bold text-white flex justify-between">
            <span>Входящие заявки</span>
            <span className="text-xs text-gray-500 font-normal">Обновляется в реальном времени</span>
        </div>
        <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase">
                <tr>
                    <th className="p-4">Дата</th>
                    <th className="p-4">Имя</th>
                    <th className="p-4">Телефон</th>
                    <th className="p-4">Тип</th>
                </tr>
            </thead>
            <tbody>
                {leads.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-600">Заявок пока нет. Отправьте форму на главной.</td></tr>
                ) : (
                    leads.map((lead: any) => (
                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">{new Date(lead.createdAt).toLocaleString('ru-RU')}</td>
                            <td className="p-4 text-white font-bold">{lead.name}</td>
                            <td className="p-4">{lead.phone}</td>
                            <td className="p-4"><span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded text-xs">{lead.type}</span></td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}