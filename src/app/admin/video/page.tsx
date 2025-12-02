'use client';
import { useState } from 'react';
import { Upload, Play } from 'lucide-react';

export default function AdminVideo() {
  const [videos, setVideos] = useState([
    { id: 1, title: 'Обзор ЖК Символ.mp4', size: '24 MB' }
  ]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setVideos([{ id: Date.now(), title: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB` }, ...videos]);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Видео Галерея (MP4)</h1>

      <div className="bg-[#0F172A] border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-brand-green/50 transition-colors cursor-pointer relative group mb-8">
        <input type="file" accept="video/mp4" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-green/20 transition-colors">
            <Upload size={32} className="text-gray-400 group-hover:text-brand-green"/>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Перетащите видео сюда</h3>
        <p className="text-gray-500">Поддерживается MP4 (H.264). Макс 500 МБ.</p>
      </div>

      <div className="space-y-4">
        {videos.map(v => (
            <div key={v.id} className="bg-[#0F172A] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center border border-white/10">
                        <Play size={20} className="text-white"/>
                    </div>
                    <div>
                        <div className="text-white font-bold">{v.title}</div>
                        <div className="text-gray-500 text-xs">{v.size} • Локальный файл</div>
                    </div>
                </div>
                <button className="text-red-500 hover:underline text-sm">Удалить</button>
            </div>
        ))}
      </div>
    </div>
  );
}