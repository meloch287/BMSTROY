'use client';
import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { REVIEWS } from '@/data/reviews';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockReviews') || '[]');
    const editedMockReviews: Record<number, any> = JSON.parse(localStorage.getItem('editedMockReviews') || '{}');
    const mockReviews = REVIEWS.filter(r => !deletedMockIds.includes(r.id)).map(r => ({ ...r, ...editedMockReviews[r.id] }));

    fetch('/api/content?type=reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setReviews([...data, ...mockReviews]);
        else setReviews(mockReviews);
      })
      .catch(() => setReviews(mockReviews));
  }, []);

  return (
    <section id="reviews" className="py-24 relative z-10 bg-white/40">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center text-text-primary">Что говорят <span className="text-brand-green">клиенты</span></h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
                <div key={r.id || i} className="review-card review-card-hover bg-white/80 backdrop-blur-md border border-brand-green/20 p-8 rounded-3xl relative shadow-lg">
                    <Quote className="absolute top-8 right-8 text-brand-green/10 w-12 h-12" />
                    <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} className={i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                        ))}
                    </div>
                    <p className="text-text-secondary mb-6 leading-relaxed">"{r.text}"</p>
                    <div>
                        <div className="text-text-primary font-bold text-lg">{r.name}</div>
                        <div className="text-sm text-text-secondary">{r.role}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}