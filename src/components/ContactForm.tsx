'use client';
import { useState } from 'react';
import { triggerConfetti } from '@/utils/confetti';

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        type: 'Обратный звонок'
    };

    try {
        await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        setSent(true);
        triggerConfetti();
    } catch (error) {
        alert('Ошибка отправки');
    } finally {
        setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 relative z-10 overflow-hidden bg-plaster">
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md border border-brand-green/20 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden shadow-lg">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-green via-accent to-brand-green animate-pulse"></div>

          {!sent ? (
            <>
              <h2 className="text-4xl font-bold mb-4 text-text-primary">Свяжитесь с нами</h2>
              <p className="text-text-secondary mb-10">Оставьте заявку, и мы перезвоним.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" required type="text" placeholder="Ваше имя" className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl text-text-primary focus:border-brand-green outline-none"/>
                <input name="phone" required type="tel" placeholder="+7 (999) 000-00-00" className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl text-text-primary focus:border-brand-green outline-none"/>
                <button disabled={loading} className="w-full bg-gradient-to-r from-brand-green to-green-600 text-white font-bold py-5 rounded-xl transition-all disabled:opacity-50">
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                </button>
              </form>
            </>
          ) : (
            <div className="py-10 animate-fade-in">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-brand-green mb-2">Заявка принята!</h3>
                <p className="text-text-secondary">Она уже появилась в админке.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-brand-green hover:underline">Отправить еще</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}