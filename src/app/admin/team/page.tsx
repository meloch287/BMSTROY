'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Loader2, Users, Pencil, X } from 'lucide-react';
import { TEAM_MEMBERS } from '@/data/team';

export default function AdminTeam() {
  const [team, setTeam] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ name: '', role: '', exp: '', photo: '' });

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockTeam') || '[]');
    const editedMockTeam: Record<number, any> = JSON.parse(localStorage.getItem('editedMockTeam') || '{}');
    const mockTeam = TEAM_MEMBERS.filter(t => !deletedMockIds.includes(t.id)).map(t => ({ ...t, ...editedMockTeam[t.id], isMock: true }));

    fetch('/api/content?type=team')
      .then(res => res.json())
      .then(data => {
        const apiTeam = Array.isArray(data) ? data : [];
        setTeam([...apiTeam, ...mockTeam]);
      })
      .catch(() => setTeam(mockTeam));
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, photo: url }));
      } else alert('Ошибка загрузки');
    } catch { alert('Ошибка загрузки'); }
    finally { setUploading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const photoUrl = formData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&size=400&background=7CB342&color=fff`;
    const res = await fetch('/api/content', { method: 'POST', body: JSON.stringify({ type: 'team', data: { ...formData, photo: photoUrl } }) });
    const newMember = await res.json();
    setTeam(prev => [newMember, ...prev]);
    setIsCreating(false);
    setFormData({ name: '', role: '', exp: '', photo: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить сотрудника?')) return;
    const member = team.find(t => t.id === id);
    if (member?.isMock) {
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockTeam') || '[]');
      if (!deletedMockIds.includes(id)) {
        deletedMockIds.push(id);
        localStorage.setItem('deletedMockTeam', JSON.stringify(deletedMockIds));
      }
    } else {
      await fetch(`/api/content?type=team&id=${id}`, { method: 'DELETE' });
    }
    setTeam(prev => prev.filter(t => t.id !== id));
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({ name: member.name, role: member.role, exp: member.exp, photo: member.photo });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const photoUrl = formData.photo || editingMember.photo;
    if (editingMember.isMock) {
      const editedMockTeam: Record<number, any> = JSON.parse(localStorage.getItem('editedMockTeam') || '{}');
      editedMockTeam[editingMember.id] = { ...formData, photo: photoUrl };
      localStorage.setItem('editedMockTeam', JSON.stringify(editedMockTeam));
    } else {
      await fetch('/api/content', { method: 'PUT', body: JSON.stringify({ type: 'team', id: editingMember.id, data: { ...formData, photo: photoUrl } }) });
    }
    setTeam(prev => prev.map(t => t.id === editingMember.id ? { ...t, ...formData, photo: photoUrl } : t));
    setEditingMember(null);
    setFormData({ name: '', role: '', exp: '', photo: '' });
  };

  const cancelEdit = () => { setEditingMember(null); setFormData({ name: '', role: '', exp: '', photo: '' }); };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Наша Команда</h1>
        <button onClick={() => { setIsCreating(!isCreating); setEditingMember(null); }} className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Plus size={20}/> {isCreating ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {(isCreating || editingMember) && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{editingMember ? 'Редактирование' : 'Новый сотрудник'}</h2>
            {editingMember && <button onClick={cancelEdit} className="text-gray-400 hover:text-white"><X size={20}/></button>}
          </div>
          <form onSubmit={editingMember ? handleSaveEdit : handleCreate} className="space-y-4">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }} className="hidden"/>
            <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${formData.photo ? 'border-brand-green bg-brand-green/10' : 'border-white/10 hover:border-brand-green/50'}`}>
              {uploading ? <div className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin text-brand-green"/><span className="text-gray-400">Загрузка...</span></div>
              : formData.photo ? <div className="flex items-center justify-center gap-4"><img src={formData.photo} className="w-16 h-16 rounded-full object-cover"/><span className="text-brand-green">Нажмите чтобы заменить</span></div>
              : <div className="flex items-center justify-center gap-2 text-gray-400"><Upload size={20}/><span>Загрузить фото</span></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required placeholder="Имя" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <input required placeholder="Должность" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <input required placeholder="Опыт (10 лет)" value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green placeholder:text-gray-500"/>
            </div>
            <button type="submit" disabled={uploading} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-xl disabled:opacity-50">
              {editingMember ? 'Сохранить' : 'Добавить'}
            </button>
          </form>
        </div>
      )}

      {team.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><Users size={48} className="mx-auto mb-4 opacity-50"/><p>Команда пуста</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map(t => (
            <div key={t.id} className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex items-center gap-4 group hover:border-white/20 transition-all">
              <img src={t.photo} className="w-16 h-16 rounded-full object-cover bg-gray-800" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&size=400&background=7CB342&color=fff`; }}/>
              <div className="flex-1">
                <div className="font-bold text-white flex items-center gap-2">{t.name}{t.isMock && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Демо</span>}</div>
                <div className="text-brand-green text-sm">{t.role}</div>
                <div className="text-gray-500 text-xs">{t.exp}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(t)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg"><Pencil size={16}/></button>
                <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}