'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Pencil, X, HelpCircle } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faq';

export default function AdminFAQ() {
  const [faq, setFaq] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ q: '', a: '' });

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockFaq') || '[]');
    const editedMockFaq: Record<number, any> = JSON.parse(localStorage.getItem('editedMockFaq') || '{}');
    const mockFaq = FAQ_ITEMS.filter(f => !deletedMockIds.includes(f.id)).map(f => ({ ...f, ...editedMockFaq[f.id], isMock: true }));

    fetch('/api/content?type=faq')
      .then(res => res.json())
      .then(data => {
        const apiFaq = Array.isArray(data) ? data : [];
        setFaq([...apiFaq, ...mockFaq]);
      })
      .catch(() => setFaq(mockFaq));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/content', { method: 'POST', body: JSON.stringify({ type: 'faq', data: formData }) });
    const newItem = await res.json();
    setFaq(prev => [newItem, ...prev]);
    setIsCreating(false);
    setFormData({ q: '', a: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить вопрос?')) return;
    const item = faq.find(f => f.id === id);
    if (item?.isMock) {
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockFaq') || '[]');
      if (!deletedMockIds.includes(id)) {
        deletedMockIds.push(id);
        localStorage.setItem('deletedMockFaq', JSON.stringify(deletedMockIds));
      }
    } else {
      await fetch(`/api/content?type=faq&id=${id}`, { method: 'DELETE' });
    }
    setFaq(prev => prev.filter(f => f.id !== id));
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ q: item.q, a: item.a });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.isMock) {
      const editedMockFaq: Record<number, any> = JSON.parse(localStorage.getItem('editedMockFaq') || '{}');
      editedMockFaq[editingItem.id] = formData;
      localStorage.setItem('editedMockFaq', JSON.stringify(editedMockFaq));
    } else {
      await fetch('/api/content', { method: 'PUT', body: JSON.stringify({ type: 'faq', id: editingItem.id, data: formData }) });
    }
    setFaq(prev => prev.map(f => f.id === editingItem.id ? { ...f, ...formData } : f));
    setEditingItem(null);
    setFormData({ q: '', a: '' });
  };

  const cancelEdit = () => { setEditingItem(null); setFormData({ q: '', a: '' }); };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Частые вопросы (FAQ)</h1>
        <button onClick={() => { setIsCreating(!isCreating); setEditingItem(null); }} className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={20}/> {isCreating ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {(isCreating || editingItem) && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{editingItem ? 'Редактирование' : 'Новый вопрос'}</h2>
            {editingItem && <button onClick={cancelEdit} className="text-gray-400 hover:text-white"><X size={20}/></button>}
          </div>
          <form onSubmit={editingItem ? handleSaveEdit : handleCreate} className="space-y-4">
            <input required placeholder="Вопрос" value={formData.q} onChange={e => setFormData({...formData, q: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green placeholder:text-gray-500"/>
            <textarea required placeholder="Ответ" value={formData.a} onChange={e => setFormData({...formData, a: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full h-32 outline-none focus:border-brand-green resize-none placeholder:text-gray-500"/>
            <button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-xl">
              {editingItem ? 'Сохранить' : 'Добавить'}
            </button>
          </form>
        </div>
      )}

      {faq.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><HelpCircle size={48} className="mx-auto mb-4 opacity-50"/><p>Вопросов пока нет</p></div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {faq.map(item => (
            <div key={item.id} className="bg-[#0F172A] p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-white">{item.q}</h3>
                    {item.isMock && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Демо</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{item.a}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button onClick={() => handleEdit(item)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg"><Pencil size={18}/></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}