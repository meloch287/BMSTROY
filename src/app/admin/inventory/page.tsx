'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Minus } from 'lucide-react';

export default function AdminInventory() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', qty: 0, unit: 'шт' });

  useEffect(() => {
    fetch('/api/inventory').then(res => res.json()).then(data => { if(Array.isArray(data)) setItems(data) });
  }, []);

  const addItem = async () => {
    const res = await fetch('/api/inventory', { method: 'POST', body: JSON.stringify(newItem) });
    setItems([await res.json(), ...items]);
    setNewItem({ name: '', qty: 0, unit: 'шт' });
  };

  const updateQty = async (id: number, change: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, Number(item.qty) + change);
    
    const updatedItems = items.map(i => i.id === id ? { ...i, qty: newQty } : i);
    setItems(updatedItems);
    await fetch('/api/inventory', { method: 'POST', body: JSON.stringify({ action: 'update', id, qty: newQty }) });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Склад материалов</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма добавления */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 h-fit">
            <h3 className="text-white font-bold mb-4">Приход товара</h3>
            <div className="space-y-4">
                <input placeholder="Название (Ротбанд 30кг)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white"/>
                <div className="flex gap-2">
                    <input type="number" placeholder="Кол-во" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: Number(e.target.value)})} className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white"/>
                    <input placeholder="Ед. (шт)" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-24 bg-[#020617] border border-white/10 p-3 rounded-xl text-white"/>
                </div>
                <button onClick={addItem} className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors">Добавить на склад</button>
            </div>
        </div>

        {/* Таблица остатков */}
        <div className="lg:col-span-2 bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-xs uppercase text-white">
                    <tr>
                        <th className="p-4">Материал</th>
                        <th className="p-4 text-center">Остаток</th>
                        <th className="p-4 text-right">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                <Package size={16} className="text-gray-500"/> {item.name}
                            </td>
                            <td className="p-4 text-center">
                                <span className={`font-bold text-lg ${item.qty < 5 ? 'text-red-500' : 'text-green-500'}`}>{item.qty}</span> {item.unit}
                            </td>
                            <td className="p-4 flex justify-end gap-2">
                                <button onClick={() => updateQty(item.id, -1)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg"><Minus size={16}/></button>
                                <button onClick={() => updateQty(item.id, 1)} className="p-2 bg-white/5 hover:bg-green-500/20 hover:text-green-500 rounded-lg"><Plus size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}