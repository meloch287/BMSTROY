'use client';
import { useState } from 'react';
import { Gift, Percent, Ruler, X } from 'lucide-react';
import { triggerConfetti } from '@/utils/confetti';
import { formatPhone, validatePhone } from '@/utils/phone';

const PROMOS = [
  {
    id: 1,
    icon: Percent,
    badge: '-15%',
    title: 'Скидка на ремонт кухни',
    desc: 'При заказе полного ремонта квартиры — скидка 15% на отделку кухонной зоны.',
    validity: 'до 31 декабря 2025',
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 2,
    icon: Ruler,
    badge: 'FREE',
    title: 'Бесплатный выезд замерщика',
    desc: 'Профессиональный замер и расчёт сметы — бесплатно и без обязательств.',
    validity: 'Постоянная акция',
    color: 'from-brand-green to-green-600'
  },
  {
    id: 3,
    icon: Gift,
    badge: '🎁',
    title: 'Дизайн-проект в подарок',
    desc: 'При заказе премиум-ремонта от 100 м² — дизайн-проект в подарок.',
    validity: 'до 28 февраля 2026',
    color: 'from-purple-500 to-pink-500'
  }
];

export default function Promos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<typeof PROMOS[0] | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const openPromo = (promo: typeof PROMOS[0]) => {
    setSelectedPromo(promo);
    setModalOpen(true);
    setSent(false);
    setFormData({ name: '', phone: '' });
    setErrors({});
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) });
    if (errors.phone) setErrors({ ...errors, phone: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; phone?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Введите корректный телефон';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
          type: `Акция: ${selectedPromo?.title}`,
          comment: `Заявка по акции "${selectedPromo?.title}"`
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
    <section id="promos" className="py-24 relative z-10 bg-white/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-text-primary">
            Акции и <span className="text-brand-green">спецпредложения</span>
          </h2>
          <p className="text-text-secondary">Выгодные условия для наших клиентов</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROMOS.map((promo) => (
            <div
              key={promo.id}
              className="group relative bg-white/80 backdrop-blur-md border border-brand-green/20 rounded-3xl p-8 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className={`absolute top-4 right-4 bg-gradient-to-r ${promo.color} text-white px-4 py-1 rounded-full text-sm font-bold`}>
                {promo.badge}
              </div>
              
              <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <promo.icon className="w-8 h-8 text-brand-green" />
              </div>
              
              <h3 className="text-xl font-bold text-text-primary mb-3">{promo.title}</h3>
              <p className="text-text-secondary mb-4">{promo.desc}</p>
              
              <div className="text-sm text-brand-green-text font-semibold mb-6">
                Действует {promo.validity}
              </div>
              
              <button
                onClick={() => openPromo(promo)}
                className="w-full py-3 border-2 border-brand-green text-brand-green font-bold rounded-xl hover:bg-brand-green hover:text-white transition-all"
              >
                Узнать подробнее
              </button>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && selectedPromo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className={`w-20 h-20 bg-gradient-to-r ${selectedPromo.color} rounded-2xl flex items-center justify-center mb-6 text-white`}>
              <selectedPromo.icon className="w-10 h-10" />
            </div>
            
            <h3 className="text-2xl font-bold text-text-primary mb-4">{selectedPromo.title}</h3>
            <p className="text-text-secondary mb-6">{selectedPromo.desc}</p>
            
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Ваше имя *"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:border-brand-green outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="+7 (999) 000-00-00 *"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:border-brand-green outline-none ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Отправка...' : 'Получить предложение'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h4 className="text-xl font-bold text-brand-green-text mb-2">Заявка отправлена!</h4>
                <p className="text-text-secondary mb-4">Мы свяжемся с вами в ближайшее время</p>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-brand-green hover:underline"
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
