'use client';
import { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Upload, Layers, Loader2 } from 'lucide-react';

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetch('/api/services').then(res => res.json()).then(setServices);
  }, []);

  const saveServices = async () => {
    await fetch('/api/services', { method: 'POST', body: JSON.stringify(services) });
    alert('Услуги обновлены!');
  };

  const handleFileUpload = async (serviceIndex: number, file: File) => {
    const key = `${serviceIndex}`;
    setUploading(key);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const { url } = await res.json();
        const updated = [...services];
        updated[serviceIndex].images.push(url);
        setServices(updated);
      } else {
        alert('Ошибка загрузки файла');
      }
    } catch (error) {
      alert('Ошибка загрузки');
    } finally {
      setUploading(null);
    }
  };

  const triggerFileInput = (serviceIndex: number) => {
    const key = `service-${serviceIndex}`;
    fileInputRefs.current[key]?.click();
  };

  const removeImage = (serviceIndex: number, imgIndex: number) => {
    const updated = [...services];
    updated[serviceIndex].images = updated[serviceIndex].images.filter((_: any, i: number) => i !== imgIndex);
    setServices(updated);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Редактор блоков Услуг</h1>
        <button onClick={saveServices} className="bg-brand-green hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg">
            <Save size={20}/> Сохранить изменения
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {services.map((service, sIdx) => (
            <div key={service.id} className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                    <Layers className="text-brand-green"/>
                    <div>
                        <h3 className="text-xl font-bold text-white">{service.title}</h3>
                        <p className="text-gray-500 text-sm">{service.desc}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {service.images.map((img: string, i: number) => (
                        <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-white/10">
                            <img src={img} className="w-full h-full object-cover" alt=""/>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={() => removeImage(sIdx, i)} 
                                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Кнопка добавления с загрузкой файла */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={el => { fileInputRefs.current[`service-${sIdx}`] = el; }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(sIdx, file);
                            e.target.value = '';
                        }}
                        className="hidden"
                    />
                    <button 
                        onClick={() => triggerFileInput(sIdx)} 
                        disabled={uploading === `${sIdx}`}
                        className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:border-brand-green hover:text-brand-green transition-colors disabled:opacity-50"
                    >
                        {uploading === `${sIdx}` ? (
                            <>
                                <Loader2 size={24} className="animate-spin"/>
                                <span className="text-xs mt-2">Загрузка...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={24}/>
                                <span className="text-xs mt-2">Загрузить фон</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}