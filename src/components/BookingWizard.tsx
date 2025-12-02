'use client';
import { useState } from 'react';
import { Clock, CheckCircle, ArrowRight, ChevronLeft } from 'lucide-react';
import { triggerConfetti } from '@/utils/confetti';
import { formatPhone, validatePhone } from '@/utils/phone';

const TIMES = ['10:00', '11:30', '13:00', '15:30', '17:00', '19:00'];
const DATES = Array.from({length: 14}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { 
        day: d.getDate(), 
        month: d.toLocaleDateString('ru-RU', { month: 'short' }),
        week: d.toLocaleDateString('ru-RU', { weekday: 'short' }), 
        full: d 
    };
});

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(0);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (errors.phone) setErrors({ ...errors, phone: undefined });
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Введите имя';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 3) {
      if (!validateForm()) return;
      
      setLoading(true);
      try {
        const selectedDate = DATES[date];
        const dateStr = `${selectedDate.day} ${selectedDate.month}`;
        
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            type: 'Замер',
            comment: `Дата: ${dateStr}, Время: ${time}, Адрес: ${formData.address || 'Не указан'}`
          })
        });
        
        triggerConfetti();
        setStep(4);
      } catch (error) {
        alert('Ошибка отправки. Попробуйте ещё раз.');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const resetForm = () => {
    setStep(1);
    setDate(0);
    setTime('');
    setFormData({ name: '', phone: '', address: '' });
    setErrors({});
  };

  return (
    <section id="booking" className="py-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md border border-brand-green/20 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]">
            
            <div className="bg-brand-green p-8 md:w-1/3 border-b md:border-r md:border-b-0 border-brand-green-dark flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Запись на замер</h3>
                    <div className="space-y-6">
                        {['Выбор даты', 'Время', 'Контакты'].map((label, i) => (
                            <div key={i} className={`flex items-center gap-3 ${step > i + 1 ? 'text-white' : step === i + 1 ? 'text-white' : 'text-white/60'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${step > i + 1 ? 'bg-white border-white text-brand-green' : step === i + 1 ? 'border-white text-white' : 'border-white/40'}`}>
                                    {step > i + 1 ? <CheckCircle size={16}/> : i + 1}
                                </div>
                                <span className="font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 p-4 bg-white/10 rounded-xl text-sm text-white/80">
                    <p>🎁 Инженер приедет с лазерной рулеткой и каталогом материалов.</p>
                </div>
            </div>

            <div className="p-8 md:p-12 md:w-2/3 relative">
                
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">Выберите удобный день</h2>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {DATES.map((d, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setDate(i)}
                                    className={`p-3 rounded-xl border text-center transition-all ${
                                        date === i 
                                        ? 'bg-brand-green border-brand-green text-white shadow-lg' 
                                        : 'border-gray-300 hover:bg-brand-green/5 text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    <div className="text-xs uppercase mb-1 opacity-60">{d.week}</div>
                                    <div className="text-xl font-bold">{d.day}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">Выберите время</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {TIMES.map((t) => (
                                <button 
                                    key={t}
                                    onClick={() => setTime(t)}
                                    className={`py-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                                        time === t
                                        ? 'bg-brand-green border-brand-green text-white shadow-lg'
                                        : 'border-gray-300 hover:bg-brand-green/5 text-text-secondary'
                                    }`}
                                >
                                    <Clock size={18}/> {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in">
                         <h2 className="text-2xl font-bold text-text-primary mb-6">Ваши данные</h2>
                         <div className="space-y-4">
                            <div>
                              <input 
                                type="text" 
                                placeholder="Имя *" 
                                value={formData.name}
                                onChange={(e) => {
                                  setFormData({ ...formData, name: e.target.value });
                                  if (errors.name) setErrors({ ...errors, name: undefined });
                                }}
                                className={`w-full p-4 bg-white border rounded-xl text-text-primary focus:border-brand-green outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                              />
                              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>
                            <div>
                              <input 
                                type="tel" 
                                placeholder="+7 (999) 000-00-00 *" 
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                className={`w-full p-4 bg-white border rounded-xl text-text-primary focus:border-brand-green outline-none ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                              />
                              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                            </div>
                            <textarea 
                              placeholder="Адрес объекта (улица, дом)" 
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full p-4 bg-white border border-gray-300 rounded-xl text-text-primary focus:border-brand-green outline-none h-32 resize-none"
                            />
                         </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                        <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,179,66,0.4)]">
                            <CheckCircle size={40} className="text-white"/>
                        </div>
                        <h2 className="text-3xl font-bold text-brand-green mb-2">Вы записаны!</h2>
                        <p className="text-text-secondary">Ждем вас {DATES[date].day} {DATES[date].month} в {time}.<br/>Мы свяжемся с вами для подтверждения.</p>
                        <button onClick={resetForm} className="mt-8 text-brand-green hover:underline transition-colors">Записаться еще</button>
                    </div>
                )}

                {step < 4 && (
                    <div className="mt-12 flex justify-between pt-6 border-t border-gray-200">
                        <button 
                            onClick={() => setStep(Math.max(1, step - 1))}
                            disabled={step === 1}
                            className="text-text-secondary hover:text-text-primary disabled:opacity-0 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft size={18}/> Назад
                        </button>
                        <button 
                            onClick={handleNext}
                            disabled={step === 2 && !time}
                            className="bg-brand-green text-white hover:bg-brand-green-dark px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Запись...' : (step === 3 ? 'Подтвердить' : 'Далее')} {step !== 3 && !loading && <ArrowRight size={18}/>}
                        </button>
                    </div>
                )}

            </div>
        </div>
      </div>
    </section>
  );
}