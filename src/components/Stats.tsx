'use client';

export default function Stats() {
  const stats = [
    { value: '150+', label: 'Проектов сдано' },
    { value: '12', label: 'Лет опыта' },
    { value: '100%', label: 'Довольных клиентов' },
  ];

  return (
    <section className="py-16 relative z-10 bg-brand-green">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="text-white">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-lg md:text-xl font-medium opacity-90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
