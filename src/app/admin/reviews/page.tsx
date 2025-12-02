'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Pencil, X } from 'lucide-react';
import { REVIEWS } from '@/data/reviews';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', role: '', text: '', rating: 5 });

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockReviews') || '[]');
    const editedMockReviews: Record<number, any> = JSON.parse(localStorage.getItem('editedMockReviews') || '{}');
    const mockReviews = REVIEWS.filter(r => !deletedMockIds.includes(r.id)).map(r => ({ ...r, ...editedMockReviews[r.id], isMock: true }));

    fetch('/api/content?type=reviews')
      .then(res => res.json())
      .then(data => {
        const apiReviews = Array.isArray(data) ? data : [];
        setReviews([...apiReviews, ...mockReviews]);
      })
      .catch(() => setReviews(mockReviews));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/content', { method: 'POST', body: JSON.stringify({ type: 'reviews', data: formData }) });
    const newReview = await res.json();
    setReviews(prev => [newReview, ...prev]);
    setIsCreating(false);
    setFormData({ name: '', role: '', text: '', rating: 5 });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    const review = reviews.find(r => r.id === id);
    if (review?.isMock) {
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockReviews') || '[]');
      if (!deletedMockIds.includes(id)) {
        deletedMockIds.push(id);
        localStorage.setItem('deletedMockReviews', JSON.stringify(deletedMockIds));
      }
    } else {
      await fetch(`/api/content?type=reviews&id=${id}`, { method: 'DELETE' });
    }
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setFormData({ name: review.name, role: review.role, text: review.text, rating: review.rating });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview.isMock) {
      const editedMockReviews: Record<number, any> = JSON.parse(localStorage.getItem('editedMockReviews') || '{}');
      editedMockReviews[editingReview.id] = formData;
      localStorage.setItem('editedMockReviews', JSON.stringify(editedMockReviews));
    } else {
      await fetch('/api/content', { method: 'PUT', body: JSON.stringify({ type: 'reviews', id: editingReview.id, data: formData }) });
    }
    setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, ...formData } : r));
    setEditingReview(null);
    setFormData({ name: '', role: '', text: '', rating: 5 });
  };

  const cancelEdit = () => { setEditingReview(null); setFormData({ name: '', role: '', text: '', rating: 5 }); };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Отзывы клиентов</h1>
        <button onClick={() => { setIsCreating(!isCreating); setEditingReview(null); }} className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={20}/> {isCreating ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {(isCreating || editingReview) && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{editingReview ? 'Редактирование' : 'Новый отзыв'}</h2>
            {editingReview && <button onClick={cancelEdit} className="text-gray-400 hover:text-white"><X size={20}/></button>}
          </div>
          <form onSubmit={editingReview ? handleSaveEdit : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required placeholder="Имя клиента" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <input required placeholder="Объект (ЖК Символ)" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Оценка:</span>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setFormData({...formData, rating: n})} className={`p-1 ${formData.rating >= n ? 'text-yellow-500' : 'text-gray-600'}`}>
                    <Star size={20} fill={formData.rating >= n ? 'currentColor' : 'none'}/>
                  </button>
                ))}
              </div>
            </div>
            <textarea required placeholder="Текст отзыва" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full h-24 outline-none focus:border-brand-green resize-none placeholder:text-gray-500"/>
            <button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-xl">
              {editingReview ? 'Сохранить' : 'Добавить'}
            </button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><Star size={48} className="mx-auto mb-4 opacity-50"/><p>Отзывов пока нет</p></div>
      ) : (
        <div className="grid gap-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/20 transition-all">
              <div className="flex-1">
                <div className="flex gap-2 items-center mb-1">
                  <span className="font-bold text-white">{r.name}</span>
                  {r.isMock && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Демо</span>}
                  <div className="flex text-yellow-500 ml-2">{[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? 'currentColor' : 'none'} className={i < r.rating ? '' : 'text-gray-600'}/>)}</div>
                </div>
                <p className="text-sm text-gray-400">{r.text}</p>
                <p className="text-xs text-gray-600 mt-1">{r.role}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(r)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg"><Pencil size={18}/></button>
                <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}