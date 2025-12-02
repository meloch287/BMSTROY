'use client';
import { useState, useEffect } from 'react';
import { TEAM_MEMBERS } from '@/data/team';

export default function Team() {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockTeam') || '[]');
    const editedMockTeam: Record<number, any> = JSON.parse(localStorage.getItem('editedMockTeam') || '{}');
    const mockTeam = TEAM_MEMBERS.filter(t => !deletedMockIds.includes(t.id)).map(t => ({ ...t, ...editedMockTeam[t.id] }));

    fetch('/api/content?type=team')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setTeam([...data, ...mockTeam]);
        else setTeam(mockTeam);
      })
      .catch(() => setTeam(mockTeam));
  }, []);

  return (
    <section id="team" className="py-24 relative z-10 bg-white/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-text-primary">Команда <span className="text-brand-green">БМСтрой</span></h2>
            <p className="text-text-secondary">Профессионалы с опытом от 7 лет</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {team.map((t, i) => (
                <div key={t.id || i} className="team-member text-center group">
                    <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden border-4 border-brand-green/20 mb-4 relative bg-gray-200 group-hover:border-brand-green transition-colors">
                        <img 
                          src={t.photo} 
                          loading="lazy"
                          width={160}
                          height={160}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt={t.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&size=400&background=7CB342&color=fff`;
                          }}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">{t.name}</h3>
                    <div className="text-brand-green-text text-sm font-bold uppercase tracking-wider mb-1">{t.role}</div>
                    <div className="text-text-secondary text-xs">{t.exp}</div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}