'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight, Wand2, User, Phone } from 'lucide-react';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  status: 'available' | 'booked' | 'unavailable';
  bookedBy?: {
    leadId: number;
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

const VALID_TIMES = [
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00'
];

const STATUS_COLORS = {
  available: 'bg-green-500',
  booked: 'bg-yellow-500',
  unavailable: 'bg-gray-500',
};

const STATUS_LABELS = {
  available: 'Доступен',
  booked: 'Занят',
  unavailable: 'Недоступен',
};

export default function AdminBookingSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [generating, setGenerating] = useState(false);


  const formatDateStr = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const fetchAllSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/booking-slots?init=true');
      const data = await res.json();
      setAllSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch all slots:', error);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = formatDateStr(selectedDate);
      const res = await fetch(`/api/booking-slots?date=${dateStr}`);
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAllSlots();
  }, [fetchAllSlots]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('Удалить слот?')) return;
    try {
      await fetch(`/api/booking-slots?id=${id}`, { method: 'DELETE' });
      setSlots(slots.filter(s => s.id !== id));
      setAllSlots(allSlots.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete slot:', error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: TimeSlot['status']) => {
    try {
      const res = await fetch('/api/booking-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setSlots(slots.map(s => s.id === id ? updated : s));
        setAllSlots(allSlots.map(s => s.id === id ? updated : s));
      }
    } catch (error) {
      console.error('Failed to update slot:', error);
    }
  };

  const handleGenerateSlots = async () => {
    if (!confirm('Сгенерировать слоты на 14 дней вперед? Существующие слоты сохранятся.')) return;
    setGenerating(true);
    try {
      await fetch('/api/booking-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateDays: 14 })
      });
      await fetchAllSlots();
      await fetchSlots();
    } catch (error) {
      console.error('Failed to generate slots:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSlot = async (time: string) => {
    try {
      const res = await fetch('/api/booking-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formatDateStr(selectedDate), time })
      });
      if (res.ok) {
        const newSlot = await res.json();
        setSlots([...slots, newSlot]);
        setAllSlots([...allSlots, newSlot]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add slot:', error);
    }
  };


  // Get dates with slots for calendar highlighting
  const datesWithSlots = new Set(allSlots.map(s => s.date));

  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of month
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthName = selectedDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const dayName = selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  // Get available times that don't have slots yet for the selected date
  const existingTimes = new Set(slots.map(s => s.time));
  const availableTimes = VALID_TIMES.filter(t => !existingTimes.has(t));

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Слоты замеров</h1>
          <p className="text-gray-500 text-sm mt-1">
            Управление расписанием замеров
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateSlots}
            disabled={generating}
            className="bg-[#0F172A] px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-brand-green transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Wand2 size={18} className={generating ? 'animate-spin' : ''}/> 
            Сгенерировать
          </button>
          <button 
            onClick={fetchSlots}
            className="bg-[#0F172A] p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-brand-green transition-colors"
            title="Обновить"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1">
        {/* Calendar */}
        <div className="w-80 bg-[#0F172A] rounded-2xl border border-white/5 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20}/>
            </button>
            <span className="text-white font-bold capitalize">{monthName}</span>
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = formatDateStr(day);
              const isSelected = formatDateStr(selectedDate) === dateStr;
              const hasSlots = datesWithSlots.has(dateStr);
              const isToday = formatDateStr(new Date()) === dateStr;
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-lg text-sm transition-all relative ${
                    isSelected 
                      ? 'bg-brand-green text-white' 
                      : isToday
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {day.getDate()}
                  {hasSlots && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-green rounded-full"/>
                  )}
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={handleToday}
            className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl hover:border-brand-green transition-colors"
          >
            Сегодня
          </button>
        </div>


        {/* Slots List */}
        <div className="flex-1 bg-[#0F172A] rounded-2xl border border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={handlePrevDay} className="p-2 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={20}/>
              </button>
              <div>
                <span className="text-white font-bold capitalize">{dayName}</span>
                <span className="text-gray-500 text-sm ml-2">({slots.length} слотов)</span>
              </div>
              <button onClick={handleNextDay} className="p-2 text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={20}/>
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={availableTimes.length === 0}
              className="bg-brand-green px-4 py-2 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18}/> Добавить слот
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-brand-green" size={32}/>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50"/>
                <p>Нет слотов на выбранную дату</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-brand-green hover:underline"
                >
                  Добавить слот
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {slots
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(slot => (
                    <div 
                      key={slot.id}
                      className="bg-[#1E293B] p-4 rounded-xl flex items-center justify-between group hover:ring-2 ring-brand-green/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                          <Clock size={24} className="text-brand-green"/>
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">{slot.time}</div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[slot.status]}`}/>
                            <span className="text-gray-400 text-sm">{STATUS_LABELS[slot.status]}</span>
                          </div>
                        </div>
                        
                        {slot.bookedBy && (
                          <div className="ml-4 pl-4 border-l border-white/10">
                            <div className="flex items-center gap-2 text-white text-sm">
                              <User size={14}/> {slot.bookedBy.name}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Phone size={14}/> {slot.bookedBy.phone}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={slot.status}
                          onChange={(e) => handleStatusChange(slot.id, e.target.value as TimeSlot['status'])}
                          className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-green outline-none"
                        >
                          <option value="available">Доступен</option>
                          <option value="booked">Занят</option>
                          <option value="unavailable">Недоступен</option>
                        </select>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div 
            className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Добавить слот</h2>
            <p className="text-gray-400 text-sm mb-4">
              {dayName}
            </p>
            
            {availableTimes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Все слоты на этот день уже созданы
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => handleAddSlot(time)}
                    className="py-3 px-4 bg-[#0F172A] border border-white/10 rounded-xl text-white font-bold hover:border-brand-green hover:bg-brand-green/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock size={16}/> {time}
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
