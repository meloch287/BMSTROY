'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon, Pencil, X, Images } from 'lucide-react';
import { PORTFOLIO_PROJECTS } from '@/data/portfolio';

export default function AdminPortfolio() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ 
    title: '', area: '', location: '', description: '', tags: 'Премиум', cover: '', images: [] as string[]
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        const apiProjects = Array.isArray(data) ? data : [];
        if (apiProjects.length > 0) {
          setProjects(apiProjects);
        } else {
          const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPortfolio') || '[]');
          const editedMockProjects: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPortfolio') || '{}');
          const mockProjects = PORTFOLIO_PROJECTS
            .filter(p => !deletedMockIds.includes(p.id))
            .map(p => ({ 
              ...p, 
              ...editedMockProjects[p.id],
              cover: editedMockProjects[p.id]?.cover || p.img,
              description: editedMockProjects[p.id]?.description || p.desc,
              isMock: true 
            }));
          setProjects(mockProjects);
        }
      } catch {
        const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPortfolio') || '[]');
        const editedMockProjects: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPortfolio') || '{}');
        const mockProjects = PORTFOLIO_PROJECTS
          .filter(p => !deletedMockIds.includes(p.id))
          .map(p => ({ 
            ...p, 
            ...editedMockProjects[p.id],
            cover: editedMockProjects[p.id]?.cover || p.img,
            description: editedMockProjects[p.id]?.description || p.desc,
            isMock: true 
          }));
        setProjects(mockProjects);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, cover: url }));
      } else alert('Ошибка загрузки файла');
    } catch { alert('Ошибка загрузки'); }
    finally { setUploading(false); }
  };

  const handleAdditionalUpload = async (file: File) => {
    setUploadingIndex(-1);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      } else alert('Ошибка загрузки файла');
    } catch { alert('Ошибка загрузки'); }
    finally { setUploadingIndex(null); }
  };

  const handleReplaceImage = async (file: File, index: number) => {
    setUploadingIndex(index);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => {
          const newImages = [...prev.images];
          newImages[index] = url;
          return { ...prev, images: newImages };
        });
      } else alert('Ошибка загрузки файла');
    } catch { alert('Ошибка загрузки'); }
    finally { setUploadingIndex(null); setReplaceIndex(null); }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cover) { alert('Загрузите обложку проекта'); return; }
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ ...formData, tags: formData.tags.split(',').map(t => t.trim()) })
    });
    const newProject = await res.json();
    setProjects(prev => [newProject, ...prev]);
    setIsCreating(false);
    setFormData({ title: '', area: '', location: '', description: '', tags: 'Премиум', cover: '', images: [] });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить проект?')) return;
    const project = projects.find(p => p.id === id);
    if (project?.isMock) {
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPortfolio') || '[]');
      if (!deletedMockIds.includes(id)) {
        deletedMockIds.push(id);
        localStorage.setItem('deletedMockPortfolio', JSON.stringify(deletedMockIds));
      }
    } else {
      await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
    }
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      area: project.area,
      location: project.location || '',
      description: project.description || project.desc || '',
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : project.tags || '',
      cover: project.cover || project.img || '',
      images: project.images || []
    });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const coverUrl = formData.cover || editingProject.cover || editingProject.img;
    const tagsArray = formData.tags.split(',').map(t => t.trim());
    
    if (editingProject.isMock) {
      const editedMockProjects: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPortfolio') || '{}');
      editedMockProjects[editingProject.id] = { ...formData, cover: coverUrl, tags: tagsArray, images: formData.images };
      localStorage.setItem('editedMockPortfolio', JSON.stringify(editedMockProjects));
    } else {
      await fetch('/api/portfolio', {
        method: 'PUT',
        body: JSON.stringify({ id: editingProject.id, ...formData, cover: coverUrl, tags: tagsArray, images: formData.images })
      });
    }
    setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...formData, cover: coverUrl, tags: tagsArray, images: formData.images } : p));
    setEditingProject(null);
    setFormData({ title: '', area: '', location: '', description: '', tags: 'Премиум', cover: '', images: [] });
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setFormData({ title: '', area: '', location: '', description: '', tags: 'Премиум', cover: '', images: [] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Портфолио</h1>
        <button onClick={() => { setIsCreating(!isCreating); setEditingProject(null); }} className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Plus size={20}/> {isCreating ? 'Отмена' : 'Добавить проект'}
        </button>
      </div>

      {(isCreating || editingProject) && (
        <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{editingProject ? 'Редактирование проекта' : 'Новый проект'}</h2>
            {editingProject && <button onClick={cancelEdit} className="text-gray-400 hover:text-white"><X size={20}/></button>}
          </div>
          <form onSubmit={editingProject ? handleSaveEdit : handleCreate} className="space-y-6">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }} className="hidden"/>
            <input type="file" accept="image/*" ref={additionalFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAdditionalUpload(file); e.target.value = ''; }} className="hidden"/>
            <input type="file" accept="image/*" ref={replaceFileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file && replaceIndex !== null) handleReplaceImage(file, replaceIndex); e.target.value = ''; }} className="hidden"/>
            
            <div>
              <label className="block text-xs text-gray-500 mb-2 ml-1">Обложка проекта (главное фото)</label>
              <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group ${formData.cover ? 'border-brand-green bg-brand-green/10' : 'border-white/10 hover:border-brand-green/50'}`}>
                {uploading ? (
                  <div className="flex flex-col items-center"><Loader2 size={32} className="animate-spin text-brand-green mb-2"/><p className="text-gray-400 text-sm">Загрузка...</p></div>
                ) : formData.cover ? (
                  <div className="relative"><img src={formData.cover} alt="Preview" className="max-h-40 mx-auto rounded-xl"/><p className="text-brand-green text-sm mt-2">Нажмите чтобы заменить</p></div>
                ) : (
                  <><div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-green/20 text-gray-400 group-hover:text-brand-green transition-colors"><Upload size={24}/></div><p className="text-gray-400 text-sm">Нажмите чтобы загрузить обложку</p></>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2 ml-1 flex items-center gap-2">
                <Images size={14}/> Дополнительные фото ({formData.images.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden group">
                    {uploadingIndex === idx ? (
                      <div className="w-full h-full flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-green"/></div>
                    ) : (
                      <>
                        <img src={img} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" onClick={() => { setReplaceIndex(idx); replaceFileInputRef.current?.click(); }} className="p-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"><Pencil size={14}/></button>
                          <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"><Trash2 size={14}/></button>
                        </div>
                        <span className="absolute top-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">{idx + 1}</span>
                      </>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => additionalFileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-brand-green/50 hover:text-brand-green transition-colors">
                  {uploadingIndex === -1 ? <Loader2 size={20} className="animate-spin"/> : <><Plus size={20}/><span className="text-xs mt-1">Добавить</span></>}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Название (ЖК)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <input required placeholder="Локация" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green placeholder:text-gray-500"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Площадь (85 м²)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green placeholder:text-gray-500"/>
              <input placeholder="Теги (Премиум, Лофт)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green placeholder:text-gray-500"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 ml-1">Описание работ</label>
              <textarea placeholder="Какие работы были проведены? Особенности проекта..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full h-32 outline-none focus:border-brand-green resize-none placeholder:text-gray-500"/>
            </div>
            <button type="submit" disabled={uploading} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-green/20 transition-all disabled:opacity-50">
              {editingProject ? 'Сохранить изменения' : 'Опубликовать проект'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0F172A] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
              <div className="aspect-video bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700/50 rounded w-full" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-700/50 rounded w-1/4" />
                  <div className="h-3 bg-brand-green/30 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><ImageIcon size={48} className="mx-auto mb-4 opacity-50"/><p>Проектов пока нет. Добавьте первый!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="group bg-[#0F172A] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all">
              <div className="aspect-video relative bg-gray-800">
                <img src={project.cover || project.img} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/1764611922746-1__4_.jpeg'; }}/>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(project)} className="bg-blue-500/80 p-2 rounded-lg text-white hover:bg-blue-600"><Pencil size={16}/></button>
                  <button onClick={() => handleDelete(project.id)} className="bg-red-500/80 p-2 rounded-lg text-white hover:bg-red-600"><Trash2 size={16}/></button>
                </div>
                {project.isMock && <span className="absolute top-2 left-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Демо</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">{project.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{project.description || project.desc || 'Нет описания'}</p>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{project.area}</span>
                  <span className="text-brand-green">{Array.isArray(project.tags) ? project.tags[0] : project.tags}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}