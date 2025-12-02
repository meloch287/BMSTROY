'use client';
import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';

export default function AdminFinance() {
  const [txs, setTxs] = useState<any[]>([]);
  const [newTx, setNewTx] = useState({ desc: '', amount: '', type: 'income', project: 'Общий' });
  const [projects, setProjects] = useState(['Общий', 'ЖК Символ', 'ЖК Зиларт']);

  useEffect(() => {
    fetch('/api/finance').then(res => res.json()).then(data => { if(Array.isArray(data)) setTxs(data) });
  }, []);

  const addTx = async () => {
    const res = await fetch('/api/finance', { method: 'POST', body: JSON.stringify(newTx) });
    setTxs([await res.json(), ...txs]);
    setNewTx({ desc: '', amount: '', type: 'income', project: 'Общий' });
  };

  const deleteTx = async (id: number) => {
     await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
     setTxs(txs.filter(t => t.id !== id));
  };

  const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const profit = income - expense;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Финансы</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <div className="text-gray-500 text-sm mb-2">Выручка</div>
            <div className="text-3xl font-bold text-green-500">+{income.toLocaleString()} ₽</div>
        </div>
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <div className="text-gray-500 text-sm mb-2">Расходы</div>
            <div className="text-3xl font-bold text-red-500">-{expense.toLocaleString()} ₽</div>
        </div>
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <div className="text-gray-500 text-sm mb-2">Чистая прибыль</div>
            <div className={`text-3xl font-bold ${profit >= 0 ? 'text-white' : 'text-red-500'}`}>{profit.toLocaleString()} ₽</div>
        </div>
      </div>

      {/* ADD FORM */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}>
            <option value="income">Доход (+)</option>
            <option value="expense">Расход (-)</option>
        </select>
        <select className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white" value={newTx.project} onChange={e => setNewTx({...newTx, project: e.target.value})}>
            {projects.map(p => <option key={p}>{p}</option>)}
        </select>
        <input placeholder="Описание (Аванс, Плитка)" value={newTx.desc} onChange={e => setNewTx({...newTx, desc: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white md:col-span-2"/>
        <div className="flex gap-2">
             <input type="number" placeholder="Сумма" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white"/>
             <button onClick={addTx} className="bg-brand-green hover:bg-green-600 text-white p-3 rounded-xl w-14 flex justify-center items-center"><Plus/></button>
        </div>
      </div>

      {/* HISTORY */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase"><tr><th className="p-4">Дата</th><th className="p-4">Проект</th><th className="p-4">Описание</th><th className="p-4 text-right">Сумма</th><th className="p-4"></th></tr></thead>
            <tbody>
                {txs.map(t => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="p-4"><span className="bg-white/5 px-2 py-1 rounded text-xs">{t.project}</span></td>
                        <td className="p-4 text-white font-bold">{t.desc}</td>
                        <td className={`p-4 text-right font-bold text-lg ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()} ₽
                        </td>
                        <td className="p-4 text-right"><button onClick={() => deleteTx(t.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 size={16}/></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}