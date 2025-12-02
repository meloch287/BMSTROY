'use client';
import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setIsOpen(false);
      setFormData({ name: '', message: '' });
    }, 3000);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in-up">
          <div className="bg-brand-green p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold">Напишите нам</h4>
                <p className="text-sm opacity-90">Ответим в течение 5 минут</p>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Закрыть окно чата" className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  aria-label="Ваше имя"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:border-brand-green outline-none"
                />
                <textarea
                  placeholder="Ваш вопрос..."
                  aria-label="Ваш вопрос"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:border-brand-green outline-none resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Отправить
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✓</div>
                <p className="font-bold text-brand-green-text">Сообщение отправлено!</p>
                <p className="text-sm text-gray-500">Мы скоро ответим</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isOpen ? 'bg-gray-600 rotate-90' : 'bg-brand-green hover:bg-brand-green-dark'
        }`}
      >
        {isOpen ? <X className="text-white" size={24} /> : <MessageCircle className="text-white" size={24} />}
      </button>
    </div>
  );
}
