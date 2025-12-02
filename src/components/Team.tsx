'use client';
import { useState, useEffect } from 'react';
import { TEAM_MEMBERS } from '@/data/team';

// Компонент для плавной загрузки фото команды
const FadeTeamPhoto = ({ src, name }: { src: string; name: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=7CB342&color=fff`;

  return (
    <>
      <div className={`absolute inset-0 bg-gray-200 transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
      </div>
      <img 
        src={error ? fallbackSrc : src} 
        loading="lazy"
        width={160}
        height={160}
        className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
      />
    </>
  );
};

export default function Team() {
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockTeam') || '[]');
    const editedMockTeam: Record<number, any> = JSON.parse(localStorage.getItem('editedMockTeam') || '{}');
    const mockTeam = TEAM_MEMBERS.filter(t => !deletedMockIds.includes(t.id)).map(t => ({ ...t, ...editedMockTeam[t.id] }));

    fetch('/api/content?type=team')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setTeam([...data, ...mockTeam]);
        else setTeam(mockTeam);
        setIsLoading(false);
      })
      .catch(() => {
        setTeam(mockTeam);
        setIsLoading(false);
      });
  }, []);

  return (
    <section id="team" className="py-24 relative z-10 bg-white/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-text-primary">Команда <span className="text-brand-green">БМСтрой</span></h2>
            <p className="text-text-secondary">Профессионалы с опытом от 7 лет</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {isLoading ? (
              // Скелетон загрузки
              [...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden border-4 border-brand-green/20 mb-4 relative bg-gray-200">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
                  </div>
                  <div className="h-6 w-24 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
                </div>
              ))
            ) : (
              team.map((t, i) => (
                <div key={t.id || i} className="team-member text-center group">
                    <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden border-4 border-brand-green/20 mb-4 relative bg-gray-200 group-hover:border-brand-green transition-colors">
                        <FadeTeamPhoto src={t.photo} name={t.name} />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">{t.name}</h3>
                    <div className="text-brand-green-text text-sm font-bold uppercase tracking-wider mb-1">{t.role}</div>
                    <div className="text-text-secondary text-xs">{t.exp}</div>
                </div>
              ))
            )}
        </div>
      </div>
    </section>
  );
}