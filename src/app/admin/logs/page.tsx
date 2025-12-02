'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, User, Clock } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/logs').then(res => res.json()).then(data => {
        if(Array.isArray(data)) setLogs(data.reverse());
        else setLogs([
            { id: 1, action: 'Удаление заявки', details: 'Заявка #105 удалена', user: 'Admin', date: new Date().toISOString() },
            { id: 2, action: 'Изменение цены', details: 'Штукатурка: 450 -> 500', user: 'Manager', date: new Date(Date.now() - 3600000).toISOString() }
        ]);
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Журнал действий</h1>

      <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
         <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase text-white">
                <tr>
                    <th className="p-4">Время</th>
                    <th className="p-4">Пользователь</th>
                    <th className="p-4">Действие</th>
                    <th className="p-4">Детали</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 whitespace-nowrap flex items-center gap-2">
                            <Clock size={14}/> {new Date(log.date).toLocaleString()}
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs"><User size={12}/></div>
                                {log.user}
                            </div>
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('Удал') ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                {log.action}
                            </span>
                        </td>
                        <td className="p-4 text-gray-300">{log.details}</td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}