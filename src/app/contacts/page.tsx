'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { triggerConfetti } from '@/utils/confetti';
import { useSettings } from '@/hooks/useSettings';

export default function ContactsPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings, isLoading: settingsLoading } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    agree: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agree) {
      alert('Необходимо согласие с политикой обработки данных');
      return;
    }
    
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          type: 'Заявка со страницы контактов',
          comment: `Email: ${formData.email}\n${formData.message}`
        })
      });
      setSent(true);
      triggerConfetti();
    } catch {
      alert('Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-plaster text-text-primary pb-20 md:pb-0">
      <Header />
      <MobileMenu />
      
      <div className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              Свяжитесь <span className="text-brand-green">с нами</span>
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Мы всегда рады ответить на ваши вопросы и помочь с выбором
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Контактная информация */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-8">Контактная информация</h2>
              
              <div className="space-y-6 mb-10">
                <a href={settingsLoading ? '#' : `tel:${settings?.phone?.replace(/[^\d+]/g, '') || ''}`} className="flex gap-4 p-4 bg-white/80 rounded-2xl border border-brand-green/20 hover:border-brand-green/50 transition-all group">
                  <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Телефон</h3>
                    {settingsLoading ? (
                      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                    ) : (
                      <p className="text-brand-green font-semibold text-lg">{settings?.phone}</p>
                    )}
                    <p className="text-text-secondary text-sm">Звоните с 9:00 до 20:00</p>
                  </div>
                </a>

                <a href={settingsLoading ? '#' : `mailto:${settings?.email || ''}`} className="flex gap-4 p-4 bg-white/80 rounded-2xl border border-brand-green/20 hover:border-brand-green/50 transition-all group">
                  <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Email</h3>
                    {settingsLoading ? (
                      <div className="h-6 w-44 bg-gray-200 rounded animate-pulse mb-1" />
                    ) : (
                      <p className="text-brand-green font-semibold text-lg">{settings?.email}</p>
                    )}
                    <p className="text-text-secondary text-sm">Ответим в течение часа</p>
                  </div>
                </a>

                <div className="flex gap-4 p-4 bg-white/80 rounded-2xl border border-brand-green/20">
                  <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Адрес офиса</h3>
                    {settingsLoading ? (
                      <div className="h-5 w-56 bg-gray-200 rounded animate-pulse mb-1" />
                    ) : (
                      <p className="text-text-primary font-semibold">{settings?.address}</p>
                    )}
                    <p className="text-text-secondary text-sm">Офис компании</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white/80 rounded-2xl border border-brand-green/20">
                  <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Режим работы</h3>
                    <p className="text-text-primary font-semibold">Пн-Пт: 9:00 - 20:00</p>
                    <p className="text-text-secondary text-sm">Сб: 10:00 - 18:00, Вс: выходной</p>
                  </div>
                </div>
              </div>

              {/* Мессенджеры */}
              <h3 className="font-bold text-text-primary mb-4">Напишите нам в мессенджер</h3>
              <div className="flex gap-4">
                <a 
                  href={settingsLoading ? '#' : `https://wa.me/${settings?.phone?.replace(/[^\d]/g, '') || ''}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center gap-3 p-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                >
                  <MessageCircle size={24} /> WhatsApp
                </a>
                <a 
                  href="https://t.me/bmstroy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center gap-3 p-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  <Send size={24} /> Telegram
                </a>
              </div>

              {/* Карта */}
              <div className="mt-10 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.3!2d37.537!3d55.749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a5036653d1d%3A0x1c0b3e3e3e3e3e3e!2z0J_RgNC10YHQvdC10L3RgdC60LDRjyDQvdCw0LEuLCAxMg!5e0!3m2!1sru!2sru!4v1234567890"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            {/* Форма */}
            <div className="bg-white/80 backdrop-blur-md border border-brand-green/20 rounded-3xl p-8 shadow-lg h-fit">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Оставить заявку</h2>
              <p className="text-text-secondary mb-8">Заполните форму и мы свяжемся с вами</p>
              
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Ваше имя *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Введите имя"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-brand-green outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Телефон *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-brand-green outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-brand-green outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Сообщение</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Опишите ваш проект или задайте вопрос..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-brand-green outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={formData.agree}
                      onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-brand-green"
                    />
                    <label htmlFor="agree" className="text-sm text-text-secondary">
                      Согласен с <a href="#" className="text-brand-green hover:underline">политикой обработки персональных данных</a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-brand-green mb-2">Заявка отправлена!</h3>
                  <p className="text-text-secondary mb-6">Мы свяжемся с вами в ближайшее время</p>
                  <button 
                    onClick={() => { setSent(false); setFormData({ name: '', phone: '', email: '', message: '', agree: false }); }} 
                    className="text-brand-green hover:underline font-medium"
                  >
                    Отправить ещё одну заявку
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
