'use client';
import { useState } from 'react';
import { Play, X } from 'lucide-react';

const VIDEOS = [
  { id: 'v1', title: 'Обзор ремонта в ЖК "Символ"', type: 'Обзор', thumb: '/uploads/1764611922746-1__4_.jpeg', url: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
  { id: 'v2', title: 'Отзыв: Ремонт двушки за 3 месяца', type: 'Отзыв', thumb: '/uploads/1764611959220-1__5_.jpeg', url: 'https://www.youtube.com/embed/dummy2' },
  { id: 'v3', title: 'Как мы делаем шумоизоляцию', type: 'Технологии', thumb: '/uploads/1764613804512-1__5_.jpeg', url: 'https://www.youtube.com/embed/dummy3' },
];

export default function VideoSection() {
  const [activeVideo, setActiveVideo] = useState(VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="video" className="py-32 relative z-10 bg-plaster border-t border-gray-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-text-primary">Наши <span className="text-brand-green">Работы</span> в деталях</h2>
            <p className="text-text-secondary">Лучше один раз увидеть, чем сто раз услышать.</p>
        </div>

        <div className="relative aspect-video max-w-5xl mx-auto bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group mb-12">
            {!isPlaying ? (
                <>
                    <img src={activeVideo.thumb} loading="lazy" width={1280} height={720} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" alt="Video Thumb"/>
                    <button 
                        onClick={() => setIsPlaying(true)}
                        aria-label="Воспроизвести видео"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-green/90 rounded-full flex items-center justify-center pl-2 hover:scale-110 hover:bg-brand-green transition-all shadow-[0_0_30px_rgba(124,179,66,0.5)] animate-pulse-glow"
                    >
                        <Play size={40} fill="white" className="text-white"/>
                    </button>
                    <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black to-transparent">
                        <div className="bg-brand-green px-3 py-1 rounded text-xs font-bold uppercase text-white inline-block mb-2">{activeVideo.type}</div>
                        <h3 className="text-2xl md:text-4xl font-bold text-white">{activeVideo.title}</h3>
                    </div>
                </>
            ) : (
                <iframe 
                    src={`${activeVideo.url}?autoplay=1`} 
                    className="w-full h-full" 
                    allow="autoplay; encrypted-media" 
                    allowFullScreen
                    title={activeVideo.title}
                ></iframe>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {VIDEOS.map(video => (
                <div 
                    key={video.id}
                    onClick={() => { setActiveVideo(video); setIsPlaying(false); }}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex gap-4 items-center hover:bg-brand-green/5 ${
                        activeVideo.id === video.id ? 'border-brand-green bg-brand-green/10' : 'border-gray-200'
                    }`}
                >
                    <div className="w-24 h-16 rounded-lg overflow-hidden relative shrink-0">
                        <img src={video.thumb} loading="lazy" width={96} height={64} className="w-full h-full object-cover" alt=""/>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play size={16} fill="white" className="text-white"/>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-text-secondary mb-1">{video.type}</div>
                        <h4 className="text-sm font-bold text-text-primary line-clamp-2 leading-tight">{video.title}</h4>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
}