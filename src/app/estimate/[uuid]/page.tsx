'use client';
import { useState, useEffect } from 'react';
import { Check, Phone } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function EstimateView() {
  const params = useParams();
  const uuid = params.uuid as string;
  const [est, setEst] = useState<any>(null);
  const [activeItems, setActiveItems] = useState<number[]>([]);
  const [clientPhone, setClientPhone] = useState('+7');

  useEffect(() => {
    fetch(`/api/estimates?uuid=${uuid}`).then(res => res.json()).then(data => {
        if (!data.error) {
            setEst(data);
            setActiveItems(data.items.map((_: any, i: number) => i));
            if (data.clientPhone) setClientPhone(data.clientPhone);
        }
    });
  }, [uuid]);

  if (!est) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Загрузка сметы...</div>;

  const toggleItem = (index: number) => {
    if (activeItems.includes(index)) {
        setActiveItems(activeItems.filter(i => i !== index));
    } else {
        setActiveItems([...activeItems, index]);
    }
  };

  const formatPhone = (value: string) => {
    // Keep only digits and +
    let digits = value.replace(/[^\d+]/g, '');
    
    // Ensure starts with +7
    if (!digits.startsWith('+7')) {
      if (digits.startsWith('7')) digits = '+' + digits;
      else if (digits.startsWith('8')) digits = '+7' + digits.slice(1);
      else if (!digits.startsWith('+')) digits = '+7' + digits;
    }
    
    // Format: +7 (XXX) XXX-XX-XX
    const match = digits.match(/^\+7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (match) {
      let formatted = '+7';
      if (match[1]) formatted += ` (${match[1]}`;
      if (match[1]?.length === 3) formatted += ')';
      if (match[2]) formatted += ` ${match[2]}`;
      if (match[3]) formatted += `-${match[3]}`;
      if (match[4]) formatted += `-${match[4]}`;
      return formatted;
    }
    return digits.slice(0, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setClientPhone(formatted);
  };

  const isPhoneValid = clientPhone.replace(/\D/g, '').length === 11;

  const total = est.items.reduce((acc: number, item: any, idx: number) => {
      return activeItems.includes(idx) ? acc + Number(item.price) : acc;
  }, 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-20">
      <header className="bg-[#0F172A] py-6 text-center border-b border-white/5 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
          <div className="font-bold text-xl">Смета для: <span className="text-brand-green">{est.clientName}</span></div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
         <div className="bg-[#0F172A] rounded-3xl border border-white/5 overflow-hidden mb-8 shadow-2xl">
            <div className="p-8 bg-gradient-to-r from-brand-green/10 to-transparent border-b border-white/5">
                <div className="text-gray-400 text-sm mb-1">Итоговая стоимость</div>
                <div className="text-5xl font-bold text-white">{total.toLocaleString()} ₽</div>
                <p className="text-xs text-gray-500 mt-2">Цена меняется в зависимости от выбранных опций ниже</p>
            </div>

            <div className="divide-y divide-white/5">
                {est.items.map((item: any, idx: number) => (
                    <div 
                        key={idx} 
                        onClick={() => item.isOptional && toggleItem(idx)}
                        className={`p-6 transition-colors ${item.isOptional ? 'cursor-pointer hover:bg-white/5' : ''} ${!activeItems.includes(idx) ? 'opacity-50 bg-black/20' : ''}`}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors flex-shrink-0 mt-1 ${activeItems.includes(idx) ? 'bg-brand-green border-brand-green' : 'border-gray-600'}`}>
                                    {activeItems.includes(idx) && <Check size={14} className="text-white"/>}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold text-lg ${!activeItems.includes(idx) && 'line-through decoration-gray-500'}`}>
                                        {item.name}
                                    </div>
                                    {item.description && (
                                        <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        {item.quantity && item.unit && (
                                            <span>{item.quantity} {item.unit}</span>
                                        )}
                                        {item.pricePerUnit && item.quantity > 1 && (
                                            <span>× {Number(item.pricePerUnit).toLocaleString()} ₽/{item.unit}</span>
                                        )}
                                        {item.isOptional && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                Опция (можно убрать)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="font-mono text-xl font-bold text-right flex-shrink-0">
                                {Number(item.price).toLocaleString()} ₽
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>

         {/* Phone Input */}
         {!est.approved && (
           <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-6 mb-8">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2">
               <Phone size={18} className="text-brand-green"/> 
               Ваш телефон для связи <span className="text-red-400">*</span>
             </h3>
             <input
               type="tel"
               value={clientPhone}
               onChange={handlePhoneChange}
               placeholder="+7 (999) 123-45-67"
               className={`w-full bg-[#020617] border p-4 rounded-xl text-white text-lg outline-none transition-colors ${
                 isPhoneValid ? 'border-brand-green/50 focus:border-brand-green' : 'border-white/10 focus:border-white/30'
               }`}
             />
             {!isPhoneValid && clientPhone.length > 2 && (
               <p className="text-yellow-400 text-sm mt-2">
                 Введите полный номер телефона
               </p>
             )}
           </div>
         )}

         <div className="text-center">
             {!est.approved ? (
               <>
                 <button 
                   onClick={async () => {
                     if (!isPhoneValid) {
                       alert('Пожалуйста, введите корректный номер телефона');
                       return;
                     }
                     const res = await fetch('/api/estimates', { 
                       method: 'PUT', 
                       body: JSON.stringify({ 
                         uuid, 
                         approved: true, 
                         approvedItems: activeItems,
                         clientPhone
                       }) 
                     });
                     if (res.ok) {
                       const data = await res.json();
                       setEst(data);
                     }
                   }}
                   disabled={!isPhoneValid}
                   className={`font-bold px-12 py-4 rounded-2xl text-lg shadow-lg transition-transform text-white ${
                     isPhoneValid
                       ? 'bg-brand-green hover:bg-green-600 shadow-green-500/20 hover:scale-105'
                       : 'bg-gray-600 cursor-not-allowed'
                   }`}
                 >
                   Согласовать смету
                 </button>
                 <p className="text-gray-500 text-sm mt-4">
                   Менеджер свяжется с вами для подготовки договора
                 </p>
               </>
             ) : (
               <div className="bg-[#0F172A] rounded-2xl border border-green-500/20 p-8">
                 <div className="text-green-400 text-5xl mb-4">✓</div>
                 <h3 className="text-2xl font-bold text-white mb-2">Смета согласована!</h3>
                 <p className="text-gray-400 mb-6">
                   Для вас создан личный кабинет, где вы сможете следить за ходом работ
                 </p>
                 {est.clientUuid && (
                   <a 
                     href={`/client/${est.clientUuid}`}
                     className="inline-block bg-brand-green hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
                   >
                     Перейти в личный кабинет →
                   </a>
                 )}
               </div>
             )}
         </div>
      </div>
    </div>
  );
}
