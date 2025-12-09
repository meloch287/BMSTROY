'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, CheckCircle, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { triggerConfetti } from '@/utils/confetti';
import { formatPhone, validatePhone } from '@/utils/phone';
import type { TimeSlot } from '@/lib/booking-slots';

const BOOKING_DAYS_AHEAD = 14;

interface DateOption {
  day: number;
  month: string;
  week: string;
  full: Date;
  dateStr: string;
}

interface FormData {
  name: string;
  phone: string;
  address: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

// Generate dates for the booking period
const generateDates = (): DateOption[] => Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('ru-RU', { month: 'short' }),
    week: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
    full: d,
    dateStr: d.toISOString().split('T')[0]
  };
});

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [dateIndex, setDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', phone: '', address: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [slotsInitialized, setSlotsInitialized] = useState(false);

  // Generate dates with useMemo to handle midnight refresh
  const dates = useMemo(() => generateDates(), []);

  // Fetch available slots when date changes
  useEffect(() => {
    const controller = new AbortController();

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot(null);

      try {
        const dateStr = dates[dateIndex].dateStr;
        // Only init on first fetch
        const initParam = !slotsInitialized ? '&init=true' : '';
        const res = await fetch(
          `/api/booking-slots?date=${dateStr}&available=true${initParam}`,
          { signal: controller.signal }
        );

        if (res.ok) {
          const slots = await res.json();
          setAvailableSlots(slots);
          if (!slotsInitialized) setSlotsInitialized(true);
        } else {
          setAvailableSlots([]);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        console.error('Error fetching slots:', error);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();

    return () => controller.abort();
  }, [dateIndex, dates, slotsInitialized]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setErrors(prev => prev.phone ? { ...prev, phone: undefined } : prev);
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
    setErrors(prev => prev.name ? { ...prev, name: undefined } : prev);
  }, []);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, address: e.target.value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

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
  }, [formData.name, formData.phone]);

  const submitBooking = useCallback(async (): Promise<boolean> => {
    if (!selectedSlot) return false;

    const selectedDate = dates[dateIndex];
    const dateStr = `${selectedDate.day} ${selectedDate.month}`;

    // Create lead first
    const leadRes = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        type: 'Замер',
        comment: `Дата: ${dateStr}, Время: ${selectedSlot.time}, Адрес: ${formData.address || 'Не указан'}`
      })
    });

    if (!leadRes.ok) {
      throw new Error('Не удалось создать заявку');
    }

    const leadData = await leadRes.json();

    // Book the slot with lead info
    const bookRes = await fetch('/api/booking-slots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedSlot.id,
        book: true,
        leadInfo: {
          leadId: leadData.id || Date.now(),
          name: formData.name,
          phone: formData.phone
        }
      })
    });

    if (!bookRes.ok) {
      const errorData = await bookRes.json().catch(() => ({}));
      // Slot might have been booked by someone else
      if (errorData.error?.includes('not available')) {
        throw new Error('Выбранное время уже занято. Выберите другое время.');
      }
      throw new Error('Не удалось забронировать время');
    }

    return true;
  }, [selectedSlot, dates, dateIndex, formData]);

  const handleNext = useCallback(async () => {
    if (step === 3) {
      if (!validateForm()) return;
      if (!selectedSlot) return;

      setLoading(true);
      try {
        await submitBooking();
        triggerConfetti();
        setStep(4);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ошибка отправки. Попробуйте ещё раз.';
        alert(message);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  }, [step, validateForm, selectedSlot, submitBooking]);

  const resetForm = useCallback(() => {
    setStep(1);
    setDateIndex(0);
    setSelectedSlot(null);
    setFormData({ name: '', phone: '', address: '' });
    setErrors({});
  }, []);


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
                            {dates.map((d, i) => (
                                <button 
                                    key={d.dateStr}
                                    onClick={() => setDateIndex(i)}
                                    aria-label={`${d.day} ${d.month}, ${d.week}`}
                                    aria-pressed={dateIndex === i}
                                    className={`p-3 rounded-xl border text-center transition-all ${
                                        dateIndex === i 
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
                        {slotsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-brand-green" size={32} />
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <p>Нет доступных слотов на выбранную дату.</p>
                                <p className="text-sm mt-2">Попробуйте выбрать другой день.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {availableSlots.map((slot) => (
                                    <button 
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        aria-label={`Время ${slot.time}`}
                                        aria-pressed={selectedSlot?.id === slot.id}
                                        className={`py-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                                            selectedSlot?.id === slot.id
                                            ? 'bg-brand-green border-brand-green text-white shadow-lg'
                                            : 'border-gray-300 hover:bg-brand-green/5 text-text-secondary'
                                        }`}
                                    >
                                        <Clock size={18}/> {slot.time}
                                    </button>
                                ))}
                            </div>
                        )}
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
                                onChange={handleNameChange}
                                aria-label="Имя"
                                aria-required="true"
                                aria-invalid={!!errors.name}
                                className={`w-full p-4 bg-white border rounded-xl text-text-primary focus:border-brand-green outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                              />
                              {errors.name && <p className="text-red-500 text-sm mt-1" role="alert">{errors.name}</p>}
                            </div>
                            <div>
                              <input 
                                type="tel" 
                                placeholder="+7 (999) 000-00-00 *" 
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                aria-label="Телефон"
                                aria-required="true"
                                aria-invalid={!!errors.phone}
                                className={`w-full p-4 bg-white border rounded-xl text-text-primary focus:border-brand-green outline-none ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                              />
                              {errors.phone && <p className="text-red-500 text-sm mt-1" role="alert">{errors.phone}</p>}
                            </div>
                            <textarea 
                              placeholder="Адрес объекта (улица, дом)" 
                              value={formData.address}
                              onChange={handleAddressChange}
                              aria-label="Адрес объекта"
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
                        <p className="text-text-secondary">Ждем вас {dates[dateIndex].day} {dates[dateIndex].month} в {selectedSlot?.time}.<br/>Мы свяжемся с вами для подтверждения.</p>
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
                            disabled={loading || (step === 2 && !selectedSlot) || (step === 2 && availableSlots.length === 0)}
                            className="bg-brand-green text-white hover:bg-brand-green-dark px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Запись...
                              </>
                            ) : (
                              <>
                                {step === 3 ? 'Подтвердить' : 'Далее'}
                                {step !== 3 && <ArrowRight size={18}/>}
                              </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
      </div>
    </section>
  );
}
