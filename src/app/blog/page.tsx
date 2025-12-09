'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import { POSTS as DEFAULT_POSTS } from '@/data/posts';
import { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [cat, setCat] = useState('Все');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPosts') || '[]');
    const editedMockPosts: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPosts') || '{}');
    const filteredDefaultPosts = DEFAULT_POSTS
      .filter(p => !deletedMockIds.includes(p.id))
      .map(p => ({ ...p, ...editedMockPosts[p.id] }));
    
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPosts([...data, ...filteredDefaultPosts]);
        } else {
          setPosts(filteredDefaultPosts);
        }
      })
      .catch(() => setPosts(filteredDefaultPosts))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => 
    (cat === 'Все' || p.category === cat) && 
    (p.title.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = ['Все', 'Тренды', 'Советы', 'Кейсы', 'Дизайн'];

  return (
    <main className="min-h-screen bg-plaster text-text-primary pb-20 md:pb-0">
      <Header />
      <MobileMenu />
      
      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-brand-green transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-text-primary font-medium">Блог</span>
        </div>

        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Блог о <span className="text-brand-green">ремонте</span></h1>
            <p className="text-text-secondary max-w-2xl mx-auto">Советы экспертов, обзоры материалов и вдохновение для вашего дома.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                {categories.map(c => (
                    <button 
                        key={c}
                        onClick={() => setCat(c)}
                        className={`px-6 py-2 rounded-full border transition-all whitespace-nowrap ${
                            cat === c 
                            ? 'bg-brand-green border-brand-green text-white' 
                            : 'border-gray-300 hover:bg-brand-green/10 text-text-secondary'
                        }`}
                    >
                        {c}
                    </button>
                ))}
            </div>
            
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Поиск статей..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-brand-green outline-none transition-all text-text-primary"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(post => (
                <article key={post.id} className="group bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-brand-green/20 hover:border-brand-green/50 transition-all hover:-translate-y-2 shadow-lg">
                    <div className="aspect-video relative overflow-hidden bg-gray-200">
                        <img 
                          src={post.img} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/1764611922746-1__4_.jpeg';
                          }}
                        />
                        <div className="absolute top-4 left-4 bg-brand-green/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase text-white">
                            {post.category}
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="text-text-secondary text-xs mb-3">{post.date}</div>
                        <h3 className="text-xl font-bold mb-3 text-text-primary group-hover:text-brand-green transition-colors line-clamp-2">{post.title}</h3>
                        <p className="text-text-secondary text-sm mb-6 line-clamp-3">{post.desc}</p>
                        <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-brand-green font-bold hover:gap-4 transition-all">
                            Читать далее <ArrowRight size={16}/>
                        </Link>
                    </div>
                </article>
            ))}
        </div>

        {loading && (
            <div className="text-center py-20 text-text-secondary">
                Загрузка...
            </div>
        )}

        {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-text-secondary">
                {search ? `Ничего не найдено по запросу "${search}"` : 'Статей пока нет'}
            </div>
        )}

      </div>
      <Footer />
    </main>
  );
}