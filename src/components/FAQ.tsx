'use client';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faq';

export default function FAQ() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockFaq') || '[]');
    const editedMockFaq: Record<number, any> = JSON.parse(localStorage.getItem('editedMockFaq') || '{}');
    const mockFaq = FAQ_ITEMS.filter(f => !deletedMockIds.includes(f.id)).map(f => ({ ...f, ...editedMockFaq[f.id] }));

    fetch('/api/content?type=faq')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setQuestions([...data, ...mockFaq]);
        else setQuestions(mockFaq);
      })
      .catch(() => setQuestions(mockFaq));
  }, []);

  return (
    <section id="faq" className="py-24 relative z-10 bg-plaster">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-4xl font-bold mb-12 text-center text-text-primary">Частые вопросы</h2>

        <div className="space-y-4">
          {questions.map((item, i) => (
            <div key={i} className="border border-brand-green/20 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-brand-green/5 transition-colors"
              >
                <span className="font-bold text-lg text-text-primary pr-8">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-brand-green transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              
              {openIndex === i && (
                <div className="px-6 pb-6 text-text-secondary leading-relaxed border-t border-brand-green/20 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}