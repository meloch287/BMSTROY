'use client';
import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';
import { triggerConfetti } from '@/utils/confetti';
import { formatPhone, validatePhone } from '@/utils/phone';

const DEFAULT_SETTINGS = {
  phone: '+7 (888) 888-88-88',
  email: 'info@bmstroy.ru',
  address: 'Москва, 2й Силикатный проезд, дом 14'
};

export default function ContactSection() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    repairType: '',
    comment: '',
    agree: false
  });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings({
            phone: data.phone || DEFAULT_SETTINGS.phone,
            email: data.email || DEFAULT_SETTINGS.email,
            address: data.address || DEFAULT_SETTINGS.address
          });
        }
      })
      .catch(() => {});
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (errors.phone) setErrors({ ...errors, phone: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    const newErrors: { name?: string; phone?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
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
          type: formData.repairType || 'Заявка с сайта',
          comment: formData.comment
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
    <section id="contact" className="py-24 relative z-10 bg-plaster">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-text-primary">
            Свяжитесь <span className="text-brand-green">с нами</span>
          </h2>
          <p className="text-text-secondary">Оставьте заявку или приезжайте в офис</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-8">Контактная информация</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Адрес офиса</h4>
                  <p className="text-text-secondary">{settings.address}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Телефон</h4>
                  <a href={`tel:${settings.phone.replace(/\D/g, '')}`} className="text-text-secondary hover:text-brand-green transition-colors">
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Email</h4>
                  <a href={`mailto:${settings.email}`} className="text-text-secondary hover:text-brand-green transition-colors">
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Режим работы</h4>
                  <p className="text-text-secondary">Пн-Пт: 9:00 - 20:00, Сб: 10:00 - 18:00</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <a href="https://wa.me/79990000000" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                <MessageCircle size={20} />
              </a>
              <a href="https://t.me/bmstroy" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                <Send size={20} />
              </a>
            </div>

            <div className="mt-10 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-brand-green/20 rounded-3xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Оставить заявку</h3>
            
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Ваше имя *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    placeholder="Введите имя"
                    className={`w-full px-4 py-3 border rounded-xl focus:border-brand-green outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Телефон *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (999) 000-00-00"
                    className={`w-full px-4 py-3 border rounded-xl focus:border-brand-green outline-none transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Тип ремонта</label>
                  <select
                    value={formData.repairType}
                    onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-brand-green outline-none transition-colors bg-white"
                  >
                    <option value="">Выберите тип ремонта</option>
                    <option value="Эконом">Эконом</option>
                    <option value="Стандарт">Стандарт</option>
                    <option value="Премиум">Премиум / Дизайнерский</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Комментарий</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Опишите ваш проект..."
                    rows={3}
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
                  {loading ? 'Отправка...' : 'Оставить заявку'}
                </button>
              </form>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-brand-green mb-2">Заявка отправлена!</h3>
                <p className="text-text-secondary">Мы свяжемся с вами в ближайшее время</p>
                <button onClick={() => setSent(false)} className="mt-6 text-brand-green hover:underline">
                  Отправить ещё
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
