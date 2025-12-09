'use client';
import { useState, useEffect, useRef } from 'react';
import { Upload, Play, Trash2, Plus, Loader2, Pencil, X, Youtube, Film } from 'lucide-react';

interface Video {
  id: number;
  title: string;
  type: string;
  url: string;
  thumb: string;
  isYoutube: boolean;
  createdAt: string;
  isMock?: boolean;
}

const MOCK_VIDEOS: Video[] = [
  { id: 1, title: 'Обзор ремонта в ЖК "Символ"', type: 'Обзор', url: 'https://www.youtube.com/embed/LXb3EKWsInQ', thumb: '/uploads/1764611922746-1__4_.jpeg', isYoutube: true, createdAt: '2024-12-01T10:00:00.000Z', isMock: true },
  { id: 2, title: 'Отзыв: Ремонт двушки за 3 месяца', type: 'Отзыв', url: 'https://www.youtube.com/embed/dummy2', thumb: '/uploads/1764611959220-1__5_.jpeg', isYoutube: true, createdAt: '2024-12-01T09:00:00.000Z', isMock: true },
  { id: 3, title: 'Как мы делаем шумоизоляцию', type: 'Технологии', url: 'https://www.youtube.com/embed/dummy3', thumb: '/uploads/1764613804512-1__5_.jpeg', isYoutube: true, createdAt: '2024-12-01T08:00:00.000Z', isMock: true },
];

export default function AdminVideo() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Обзор',
    url: '',
    thumb: '',
    isYoutube: false,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      // Получаем удалённые и отредактированные демо из localStorage
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockVideos') || '[]');
      const editedMockVideos: Record<number, any> = JSON.parse(localStorage.getItem('editedMockVideos') || '{}');
      
      const res = await fetch('/api/videos');
      const data = await res.json();
      const apiVideos = Array.isArray(data) ? data : [];
      
      // Фильтруем демо-видео
      const mockVideos = MOCK_VIDEOS
        .filter(v => !deletedMockIds.includes(v.id))
        .map(v => ({ ...v, ...editedMockVideos[v.id] }));
      
      setVideos([...apiVideos, ...mockVideos]);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Fallback на демо
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockVideos') || '[]');
      const editedMockVideos: Record<number, any> = JSON.parse(localStorage.getItem('editedMockVideos') || '{}');
      const mockVideos = MOCK_VIDEOS
        .filter(v => !deletedMockIds.includes(v.id))
        .map(v => ({ ...v, ...editedMockVideos[v.id] }));
      setVideos(mockVideos);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видео файл');
      return;
    }
    
    if (file.size > 500 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 500 МБ.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: formDataUpload 
      });
      
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ 
          ...prev, 
          url, 
          isYoutube: false,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '')
        }));
      } else {
        alert('Ошибка загрузки видео');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleThumbUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setUploadingThumb(true);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, thumb: url }));
      } else {
        alert('Ошибка загрузки обложки');
      }
    } catch (error) {
      alert('Ошибка загрузки');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      alert('Загрузите видео или укажите YouTube ссылку');
      return;
    }

    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const newVideo = await res.json();
    setVideos(prev => [newVideo, ...prev]);
    setIsCreating(false);
    resetForm();
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      type: video.type,
      url: video.url,
      thumb: video.thumb,
      isYoutube: video.isYoutube,
    });
    setIsCreating(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    if (editingVideo.isMock) {
      // Сохраняем в localStorage для демо
      const editedMockVideos: Record<number, any> = JSON.parse(localStorage.getItem('editedMockVideos') || '{}');
      editedMockVideos[editingVideo.id] = formData;
      localStorage.setItem('editedMockVideos', JSON.stringify(editedMockVideos));
    } else {
      await fetch('/api/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingVideo.id, ...formData })
      });
    }
    
    setVideos(prev => prev.map(v => 
      v.id === editingVideo.id ? { ...v, ...formData } : v
    ));
    setEditingVideo(null);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить видео?')) return;
    
    const video = videos.find(v => v.id === id);
    if (video?.isMock) {
      // Сохраняем в localStorage для демо
      const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockVideos') || '[]');
      if (!deletedMockIds.includes(id)) {
        deletedMockIds.push(id);
        localStorage.setItem('deletedMockVideos', JSON.stringify(deletedMockIds));
      }
    } else {
      await fetch(`/api/videos?id=${id}`, { method: 'DELETE' });
    }
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const resetForm = () => {
    setFormData({ title: '', type: 'Обзор', url: '', thumb: '', isYoutube: false });
  };

  const cancelEdit = () => {
    setEditingVideo(null);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Видео Галерея</h1>
        <button 
          onClick={() => { setIsCreating(!isCreating); setEditingVideo(null); resetForm(); }} 
          className="bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus size={20}/> {isCreating ? 'Отмена' : 'Добавить видео'}
        </button>
      </div>

      {/* Form */}
      {(isCreating || editingVideo) && (
        <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {editingVideo ? 'Редактирование видео' : 'Новое видео'}
            </h2>
            {editingVideo && (
              <button onClick={cancelEdit} className="text-gray-400 hover:text-white">
                <X size={20}/>
              </button>
            )}
          </div>

          <form onSubmit={editingVideo ? handleSaveEdit : handleCreate} className="space-y-6">
            {/* Video Source Toggle */}
            <div>
              <label className="text-gray-500 text-sm mb-2 block">Источник видео</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isYoutube: false, url: '' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    !formData.isYoutube 
                      ? 'bg-brand-green text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Film size={16}/> Загрузить MP4
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isYoutube: true, url: '' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    formData.isYoutube 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Youtube size={16}/> YouTube ссылка
                </button>
              </div>
            </div>

            {/* Video Upload or YouTube URL */}
            {!formData.isYoutube ? (
              <div>
                <label className="text-gray-500 text-sm mb-2 block">Видео файл (MP4, до 500 МБ)</label>
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,video/ogg" 
                  ref={videoInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoUpload(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group ${
                    formData.url && !formData.isYoutube
                      ? 'border-brand-green bg-brand-green/10' 
                      : 'border-white/10 hover:border-brand-green/50'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={32} className="animate-spin text-brand-green mb-2"/>
                      <p className="text-gray-400 text-sm">Загрузка видео...</p>
                    </div>
                  ) : formData.url && !formData.isYoutube ? (
                    <div className="flex flex-col items-center">
                      <video src={formData.url} className="max-h-40 rounded-xl mb-2" />
                      <p className="text-brand-green text-sm">Нажмите чтобы заменить</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-green/20 text-gray-400 group-hover:text-brand-green transition-colors">
                        <Upload size={24}/>
                      </div>
                      <p className="text-gray-400 text-sm">Нажмите или перетащите MP4 файл</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-gray-500 text-sm mb-1 block">YouTube Embed URL</label>
                <input 
                  placeholder="https://www.youtube.com/embed/VIDEO_ID" 
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-red-500 placeholder:text-gray-500"
                />
                <p className="text-gray-600 text-xs mt-1">Формат: https://www.youtube.com/embed/VIDEO_ID</p>
              </div>
            )}

            {/* Thumbnail */}
            <div>
              <label className="text-gray-500 text-sm mb-2 block">Обложка (превью)</label>
              <input 
                type="file" 
                accept="image/*" 
                ref={thumbInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleThumbUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <div 
                onClick={() => thumbInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                  formData.thumb ? 'border-brand-green bg-brand-green/10' : 'border-white/10 hover:border-brand-green/50'
                }`}
              >
                {uploadingThumb ? (
                  <Loader2 size={20} className="animate-spin text-brand-green mx-auto"/>
                ) : formData.thumb ? (
                  <div className="flex items-center gap-4">
                    <img src={formData.thumb} alt="Thumb" className="h-16 rounded-lg"/>
                    <span className="text-brand-green text-sm">Нажмите чтобы заменить</span>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Загрузить обложку (необязательно для MP4)</p>
                )}
              </div>
            </div>

            {/* Title & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Название *</label>
                <input 
                  required
                  placeholder="Обзор ремонта в ЖК Символ" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Тип</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
                >
                  <option>Обзор</option>
                  <option>Отзыв</option>
                  <option>Технологии</option>
                  <option>До/После</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={uploading || !formData.url || !formData.title}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingVideo ? 'Сохранить изменения' : 'Добавить видео'}
            </button>
          </form>
        </div>
      )}

      {/* Videos List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#0F172A] p-4 rounded-xl border border-white/5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 bg-gray-700 rounded-lg"/>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-1/2"/>
                  <div className="h-3 bg-gray-700/50 rounded w-1/4"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Film size={48} className="mx-auto mb-4 opacity-50"/>
          <p>Видео пока нет. Добавьте первое!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map(video => (
            <div key={video.id} className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 bg-black rounded-lg overflow-hidden relative flex-shrink-0">
                  {video.thumb ? (
                    <img src={video.thumb} className="w-full h-full object-cover" alt=""/>
                  ) : !video.isYoutube && video.url ? (
                    <video src={video.url} className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Play size={24} className="text-gray-500"/>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-white"/>
                  </div>
                  {video.isYoutube && (
                    <div className="absolute top-1 left-1">
                      <Youtube size={16} className="text-red-500"/>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    {video.title}
                    {video.isMock && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Демо</span>}
                  </h3>
                  <div className="text-gray-500 text-sm flex items-center gap-2">
                    <span className="text-brand-green">{video.type}</span>
                    <span>•</span>
                    <span>{video.isYoutube ? 'YouTube' : 'MP4'}</span>
                    <span>•</span>
                    <span>{new Date(video.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(video)}
                  className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                >
                  <Pencil size={18}/>
                </button>
                <button 
                  onClick={() => handleDelete(video.id)}
                  className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
