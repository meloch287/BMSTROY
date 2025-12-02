'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import { POSTS as DEFAULT_POSTS } from '@/data/posts';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BlogPost() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<any>(DEFAULT_POSTS.find(p => p.id === Number(id)) || DEFAULT_POSTS[0]);

  useEffect(() => {
    // Попробуем найти пост в API
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const apiPost = data.find((p: any) => p.id === Number(id));
          if (apiPost) setPost(apiPost);
        }
      })
      .catch(() => {});
  }, [id]);

  return (
    <main className="min-h-screen bg-plaster text-text-primary pb-20 md:pb-0">
      <Header />
      <MobileMenu />
      
      <article className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
        {/* Хлебные крошки */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/" className="hover:text-brand-green transition-colors">Главная</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-brand-green transition-colors">Блог</Link>
          <span>/</span>
          <span className="text-text-primary font-medium truncate max-w-[200px]">{post.title}</span>
        </div>

        <Link href="/blog" className="inline-flex items-center gap-2 text-text-secondary hover:text-brand-green mb-8 transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Назад к блогу
        </Link>

        <div className="mb-8">
            <div className="flex gap-4 text-sm mb-4">
                <span className="text-brand-green font-bold uppercase">{post.category}</span>
                <span className="text-text-secondary">{post.date}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">{post.title}</h1>
        </div>

        <div className="w-full aspect-video rounded-3xl mb-12 shadow-lg overflow-hidden bg-gray-200">
          <img 
            src={post.img} 
            alt={post.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/uploads/1764611922746-1__4_.jpeg';
            }}
          />
        </div>

        <div className="prose prose-lg max-w-none">
            <p className="lead text-xl text-text-secondary mb-8">{post.desc}</p>
            <div className="text-text-primary">
                <p>{post.content}</p>
                <p>В реальном проекте здесь будет отрендеренный Markdown контент...</p>
                <h2 className="text-text-primary font-bold">Почему это важно?</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}