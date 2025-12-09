'use client';
import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Upload, Loader2, FileText, Pencil, X } from 'lucide-react';
import { POSTS as MOCK_POSTS } from '@/data/posts';

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ title: '', category: 'Советы', desc: '', content: '', img: '' });

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPosts') || '[]');
    const editedMockPosts: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPosts') || '{}');
    
    const mockPosts = MOCK_POSTS
      .filter(p => !deletedMockIds.includes(p.id))
      .map(p => ({ ...p, ...editedMockPosts[p.id], isMock: true }));

    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        const apiPosts = Array.isArray(data) ? data : [];
        setPosts([...apiPosts, ...mockPosts]);
      })
      .catch(() => setPosts(mockPosts));
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, img: url }));
      } else alert('Ошибка загрузки файла');
    } catch { alert('Ошибка загрузки'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    const post = posts.find(p => p.id === id);
    if (post?.isMock) {
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPosts') || '[]');
      if (!deletedMockIds.includes(id)) {
        deletedMockIds.push(id);
        localStorage.setItem('deletedMockPosts', JSON.stringify(deletedMockIds));
      }
    } else {
      await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
    }
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const imgUrl = formData.img || '/uploads/1764611922746-1__4_.jpeg';
    const res = await fetch('/api/blog', {
      method: 'POST',
      body: JSON.stringify({ ...formData, img: imgUrl, date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) })
    });
    const newPost = await res.json();
    setPosts(prev => [newPost, ...prev]);
    setIsCreating(false);
    setFormData({ title: '', category: 'Советы', desc: '', content: '', img: '' });
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({ title: post.title, category: post.category, desc: post.desc, content: post.content || '', img: post.img });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const imgUrl = formData.img || editingPost.img;
    
    if (editingPost.isMock) {
      const editedMockPosts: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPosts') || '{}');
      editedMockPosts[editingPost.id] = { ...formData, img: imgUrl };
      localStorage.setItem('editedMockPosts', JSON.stringify(editedMockPosts));
    } else {
      await fetch('/api/blog', {
        method: 'PUT',
        body: JSON.stringify({ id: editingPost.id, ...formData, img: imgUrl })
      });
    }
    setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...formData, img: imgUrl } : p));
    setEditingPost(null);
    setFormData({ title: '', category: 'Советы', desc: '', content: '', img: '' });
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setFormData({ title: '', category: 'Советы', desc: '', content: '', img: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Управление Блогом</h1>
        <button onClick={() => { setIsCreating(!isCreating); setEditingPost(null); }} className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Plus size={20}/> {isCreating ? 'Отмена' : 'Новая статья'}
        </button>
      </div>

      {(isCreating || editingPost) && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{editingPost ? 'Редактирование статьи' : 'Новая статья'}</h2>
            {editingPost && <button onClick={cancelEdit} className="text-gray-400 hover:text-white"><X size={20}/></button>}
          </div>
          <form onSubmit={editingPost ? handleSaveEdit : handleCreate} className="space-y-4">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }} className="hidden"/>
            <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${formData.img ? 'border-brand-green bg-brand-green/10' : 'border-white/10 hover:border-brand-green/50'}`}>
              {uploading ? (
                <div className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin text-brand-green"/><span className="text-gray-400 text-sm">Загрузка...</span></div>
              ) : formData.img ? (
                <div className="flex items-center gap-4"><img src={formData.img} alt="Preview" className="h-20 rounded-lg"/><span className="text-brand-green text-sm">Нажмите чтобы заменить</span></div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-400"><Upload size={20}/><span className="text-sm">Загрузить обложку статьи</span></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Заголовок" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green">
                <option>Советы</option><option>Тренды</option><option>Кейсы</option><option>Дизайн</option>
              </select>
            </div>
            <textarea required placeholder="Краткое описание" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full h-20 outline-none focus:border-brand-green resize-none placeholder:text-gray-500"/>
            <textarea required placeholder="Полный текст статьи" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full h-40 font-mono text-sm outline-none focus:border-brand-green resize-none placeholder:text-gray-500"/>
            <button type="submit" disabled={uploading} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-xl disabled:opacity-50">
              {editingPost ? 'Сохранить изменения' : 'Опубликовать'}
            </button>
          </form>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><FileText size={48} className="mx-auto mb-4 opacity-50"/><p>Статей пока нет. Создайте первую!</p></div>
      ) : (
        <div className="grid gap-4">
          {posts.map(post => (
            <div key={post.id} className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={post.img} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/1764611922746-1__4_.jpeg'; }}/>
                </div>
                <div>
                  <h3 className="text-white font-bold">
                    {post.title}
                    {post.isMock && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Демо</span>}
                  </h3>
                  <div className="text-gray-500 text-sm flex gap-2">
                    <span>{post.date || new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span className="text-brand-green">{post.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(post)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={20}/></button>
                <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}