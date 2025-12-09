'use client';
import { useState, useEffect } from 'react';
import { Save, DollarSign, Phone, MapPin } from 'lucide-react';

export default function AdminSettings() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatPhone = (value: string) => {
    let digits = value.replace(/[^\d+]/g, '');
    if (!digits.startsWith('+7')) {
      if (digits.startsWith('7')) digits = '+' + digits;
      else if (digits.startsWith('8')) digits = '+7' + digits.slice(1);
      else if (!digits.startsWith('+')) digits = '+7' + digits;
    }
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

  const handlePhoneChange = (value: string) => {
    setData({ ...data, phone: formatPhone(value) });
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(serverData => {
        const defaultData = {
          prices: [
            { id: 'standard', name: 'Стандарт', price: 10800, materials: 7000 },
            { id: 'plus', name: 'Стандарт+', price: 12600, materials: 8000 },
            { id: 'premium', name: 'Премиум', price: 17500, materials: 10000 },
          ],
          phone: '+7',
          email: '',
          address: ''
        };
        setData({ ...defaultData, ...serverData });
      })
      .catch(() => {
        setData({
          prices: [
            { id: 'standard', name: 'Стандарт', price: 10800, materials: 7000 },
            { id: 'plus', name: 'Стандарт+', price: 12600, materials: 8000 },
            { id: 'premium', name: 'Премиум', price: 17500, materials: 10000 },
          ],
          phone: '+7',
          email: '',
          address: ''
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    await fetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ type: 'settings', data })
    });
    alert('Настройки сохранены!');
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Глобальные настройки</h1>
          <div className="h-12 w-36 bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 lg:col-span-2">
            <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="grid grid-cols-3 gap-4">
                  <div className="h-10 bg-gray-700 rounded-xl animate-pulse" />
                  <div className="h-10 bg-gray-700 rounded-xl animate-pulse" />
                  <div className="h-10 bg-gray-700 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-6" />
            <div className="space-y-4">
              <div className="h-12 bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
            <div className="h-6 w-24 bg-gray-700 rounded animate-pulse mb-6" />
            <div className="h-12 bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Глобальные настройки</h1>
        <button onClick={handleSave} className="bg-brand-green hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all">
            <Save size={20}/> Сохранить
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ЦЕНЫ */}
        <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6 text-accent">
                <DollarSign size={24}/>
                <h2 className="text-xl font-bold text-white">Цены калькулятора (₽/м²)</h2>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 px-2">
                    <span>Тариф</span>
                    <span>Работы</span>
                    <span>Материалы</span>
                </div>
                {data?.prices?.map((p: any, i: number) => (
                    <div key={p.id} className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-gray-400 font-medium">{p.name}</label>
                        <input 
                            type="number" 
                            value={p.price}
                            onChange={(e) => {
                                const newPrices = [...data.prices];
                                newPrices[i].price = Number(e.target.value);
                                setData({...data, prices: newPrices});
                            }}
                            className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white font-mono focus:border-brand-green outline-none"
                        />
                        <input 
                            type="number" 
                            value={p.materials || 0}
                            onChange={(e) => {
                                const newPrices = [...data.prices];
                                newPrices[i].materials = Number(e.target.value);
                                setData({...data, prices: newPrices});
                            }}
                            className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white font-mono focus:border-brand-green outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* КОНТАКТЫ */}
        <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-6 text-blue-400">
                <Phone size={24}/>
                <h2 className="text-xl font-bold text-white">Контакты</h2>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Телефон</label>
                    <input 
                      type="tel"
                      value={data.phone || '+7'} 
                      onChange={e => handlePhoneChange(e.target.value)} 
                      placeholder="+7 (999) 123-45-67"
                      className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input 
                      type="email"
                      value={data.email || ''} 
                      onChange={e => setData({...data, email: e.target.value})} 
                      placeholder="info@company.ru"
                      className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>

        {/* АДРЕС */}
        <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-6 text-green-400">
                <MapPin size={24}/>
                <h2 className="text-xl font-bold text-white">Адрес</h2>
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">Адрес офиса</label>
                <input 
                  value={data.address || ''} 
                  onChange={e => setData({...data, address: e.target.value})} 
                  placeholder="Москва, ул. Примерная, д. 1"
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white focus:border-green-500 outline-none"
                />
            </div>
        </div>

      </div>
    </div>
  );
}