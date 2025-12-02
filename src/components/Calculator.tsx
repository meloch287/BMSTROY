'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_PACKAGES = [
  { id: 'standard', name: 'Стандарт', priceWork: 10800, priceMat: 7000, features: ['Покраска стен', 'Замена пола', 'Базовая электрика'] },
  { id: 'plus', name: 'Стандарт+', priceWork: 12600, priceMat: 8000, popular: true, features: ['Выравнивание стен', 'Замена проводки', 'Новая сантехника'] },
  { id: 'premium', name: 'Премиум', priceWork: 17500, priceMat: 10000, features: ['Дизайн-проект', 'Умный дом', 'Премиум материалы'] },
];

const MIN_AREA = 0;
const MAX_AREA = 400;

function CircularSlider({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2 - 10;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Конвертация значения в угол (0° сверху, по часовой стрелке до 360°)
  const valueToAngle = useCallback((val: number): number => {
    const percentage = (val - min) / (max - min);
    return percentage * 360;
  }, [min, max]);

  // Конвертация угла в значение
  const angleToValue = useCallback((angle: number): number => {
    let normalizedAngle = angle % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    const percentage = normalizedAngle / 360;
    return Math.round(min + percentage * (max - min));
  }, [min, max]);

  // Текущий угол и заполнение
  const currentAngle = valueToAngle(value);
  const fillLength = (currentAngle / 360) * circumference;

  // Позиция бегунка: 0° сверху, по часовой стрелке
  // Угол в радианах: -90° смещение чтобы 0° было сверху
  const knobAngleRad = ((currentAngle - 90) * Math.PI) / 180;
  const knobX = center + radius * Math.cos(knobAngleRad);
  const knobY = center + radius * Math.sin(knobAngleRad);

  const calculateValueFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return value;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left - center;
    const y = clientY - rect.top - center;
    
    // atan2(y, x) даёт угол от оси X (справа)
    // Нам нужен угол от оси Y (сверху), по часовой стрелке
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    return angleToValue(angle);
  }, [center, value, angleToValue]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newVal = calculateValueFromPosition(clientX, clientY);
      if (newVal !== value) onChange(newVal);
    };
    
    const handleEnd = () => { isDraggingRef.current = false; };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [calculateValueFromPosition, onChange, value]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const newVal = calculateValueFromPosition(clientX, clientY);
    if (newVal !== value) onChange(newVal);
  };

  // Клик по кругу для быстрого перемещения
  const handleCircleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const newVal = calculateValueFromPosition(e.clientX, e.clientY);
    onChange(newVal);
  };

  return (
    <div ref={containerRef} className="relative select-none" style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        className="cursor-pointer"
        onClick={handleCircleClick}
      >
        {/* Фоновый круг (серый) */}
        <circle 
          cx={center} 
          cy={center} 
          r={radius} 
          fill="none" 
          stroke="#E5E7EB" 
          strokeWidth={strokeWidth}
        />
        {/* Заполненная часть (зелёная) - начинается сверху */}
        <circle 
          cx={center} 
          cy={center} 
          r={radius} 
          fill="none" 
          stroke="#7CB342" 
          strokeWidth={strokeWidth}
          strokeDasharray={`${fillLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      
      {/* Бегунок */}
      <div
        className="absolute w-11 h-11 bg-white rounded-full border-[3px] border-brand-green shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform"
        style={{ 
          left: knobX - 22, 
          top: knobY - 22,
          boxShadow: '0 4px 15px rgba(124, 179, 66, 0.4)'
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className="w-4 h-4 bg-brand-green rounded-full" />
      </div>
      
      {/* Центральное значение */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-5xl font-bold text-text-primary">{value}</span>
        <span className="text-base text-text-secondary font-medium">м²</span>
      </div>
    </div>
  );
}

export default function Calculator() {
  const [area, setArea] = useState(77);
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [selectedPack, setSelectedPack] = useState(DEFAULT_PACKAGES[1]);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.prices && Array.isArray(data.prices)) {
          const updatedPackages = DEFAULT_PACKAGES.map((pkg, i) => ({
            ...pkg,
            priceWork: data.prices[i]?.price || pkg.priceWork,
            priceMat: data.prices[i]?.materials || pkg.priceMat
          }));
          setPackages(updatedPackages);
          setSelectedPack(updatedPackages[1]);
        }
      })
      .catch(() => {});
  }, []);

  const discount = hasDiscount ? 0.9 : 1;
  const workPrice = Math.round(area * selectedPack.priceWork * discount);
  const matPrice = area * selectedPack.priceMat;
  const totalPrice = workPrice + matPrice;

  return (
    <section id="calculator" className="py-16 md:py-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Калькулятор <span className="text-gradient-main">стоимости</span></h2>
          <p className="text-text-secondary">Рассчитайте примерную стоимость ремонта</p>
        </div>
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-brand-green/20 overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-2/5 p-8 md:p-10 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200">
              <p className="text-text-secondary text-sm mb-6 text-center">Выберите общую площадь квартиры</p>
              <CircularSlider value={area} onChange={setArea} min={MIN_AREA} max={MAX_AREA} />
              <div className="flex justify-between w-full max-w-[200px] mt-4 text-xs text-text-secondary">
                <span>{MIN_AREA} м²</span>
                <span>{MAX_AREA} м²</span>
              </div>
              <div className="mt-8 flex items-center gap-3 cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${hasDiscount ? 'bg-brand-green' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-5 h-5 rounded-full shadow transition-transform ${hasDiscount ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-text-secondary">Скидка 10% при предоплате</span>
              </div>
            </div>
            <div className="lg:w-3/5 p-8 md:p-10">
              <div className="mb-6">
                <label className="text-text-secondary text-sm mb-3 block">Тип ремонта</label>
                <div className="grid grid-cols-3 gap-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} onClick={() => setSelectedPack(pkg)} className={`cursor-pointer p-4 rounded-xl border text-center transition-all relative ${selectedPack.id === pkg.id ? 'border-brand-green bg-brand-green/10 shadow-md' : 'border-gray-200 bg-white hover:border-brand-green/50'}`}>
                      {pkg.popular && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-green-dark text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Популярный</div>}
                      <h3 className="font-bold text-text-primary text-sm mb-1">{pkg.name}</h3>
                      <p className="text-brand-green-text font-bold text-xs">{pkg.priceWork.toLocaleString()} ₽/м²</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-text-secondary mb-2">Что входит в «{selectedPack.name}»:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPack.features.map((f) => <span key={f} className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 text-text-primary">{f}</span>)}
                </div>
              </div>
              <div className="bg-brand-green-dark rounded-2xl p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white text-sm">Ориентировочная стоимость</p>
                    <p className="text-3xl md:text-4xl font-bold">{totalPrice.toLocaleString()} ₽</p>
                  </div>
                  {hasDiscount && <div className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold">-10%</div>}
                </div>
                <div className="space-y-2 text-sm border-t border-white/30 pt-4 mb-4">
                  <div className="flex justify-between"><span className="text-white">Работы ({selectedPack.name})</span><span className="font-semibold">{workPrice.toLocaleString()} ₽</span></div>
                  <div className="flex justify-between"><span className="text-white">Материалы</span><span className="font-semibold">{matPrice.toLocaleString()} ₽</span></div>
                </div>
                <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="w-full bg-white text-brand-green py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">Получить точную смету</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
