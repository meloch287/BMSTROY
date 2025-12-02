'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowUpRight, X, MapPin, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';
import { PORTFOLIO_PROJECTS } from '@/data/portfolio';

export default function Portfolio() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getProjectImages = (project: any) => {
    const images: string[] = [];
    if (project.cover || project.img) images.push(project.cover || project.img);
    if (project.images && Array.isArray(project.images)) {
      project.images.forEach((img: string) => {
        if (!images.includes(img)) images.push(img);
      });
    }
    return images.length > 0 ? images : ['/uploads/1764611922746-1__4_.jpeg'];
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProject) return;
    const images = getProjectImages(selectedProject);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProject) return;
    const images = getProjectImages(selectedProject);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        const apiProjects = Array.isArray(data) ? data : [];
        if (apiProjects.length > 0) {
          setProjects(apiProjects);
        } else {
          const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPortfolio') || '[]');
          const editedMockProjects: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPortfolio') || '{}');
          const mockProjects = PORTFOLIO_PROJECTS
            .filter(p => !deletedMockIds.includes(p.id))
            .map(p => ({
              ...p,
              ...editedMockProjects[p.id],
              cover: editedMockProjects[p.id]?.cover || p.img,
              desc: editedMockProjects[p.id]?.description || p.desc,
              images: editedMockProjects[p.id]?.images || [],
            }));
          setProjects(mockProjects);
        }
      } catch {
        const deletedMockIds: number[] = JSON.parse(localStorage.getItem('deletedMockPortfolio') || '[]');
        const editedMockProjects: Record<number, any> = JSON.parse(localStorage.getItem('editedMockPortfolio') || '{}');
        const mockProjects = PORTFOLIO_PROJECTS
          .filter(p => !deletedMockIds.includes(p.id))
          .map(p => ({
            ...p,
            ...editedMockProjects[p.id],
            cover: editedMockProjects[p.id]?.cover || p.img,
            desc: editedMockProjects[p.id]?.description || p.desc,
            images: editedMockProjects[p.id]?.images || [],
          }));
        setProjects(mockProjects);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProject) {
        setSelectedProject(null);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedProject]);

  const closeModal = () => {
    setSelectedProject(null);
    setCurrentImageIndex(0);
  };

  return (
    <section id="portfolio" className="py-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-text-primary">Наши <span className="text-gradient-main">Проекты</span></h2>
            <p className="text-text-secondary">Реализованные объекты с душой</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse overflow-hidden">
                <div className="w-full h-full flex flex-col justify-end p-6">
                  <div className="h-6 bg-gray-400/50 rounded-lg w-3/4 mb-2" />
                  <div className="h-4 bg-gray-400/30 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : (
            projects.map((project) => (
              <div 
                  key={project.id} 
                  onClick={() => setSelectedProject(project)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-3xl cursor-pointer bg-gray-200 border-2 border-transparent hover:border-brand-green shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <Image 
                  src={project.cover || project.img || '/uploads/1764611922746-1__4_.jpeg'} 
                  alt={project.title} 
                  loading="lazy"
                  width={400}
                  height={300}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1 drop-shadow-lg">{project.title}</h3>
                      <p className="text-brand-green-light font-semibold">{project.area}</p>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:bg-brand-green text-white border border-white/30">
                    <ArrowUpRight size={22} />
                </div>
                <div className="absolute bottom-4 right-4 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-1">
                    Нажмите для просмотра
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {mounted && selectedProject && createPortal(
        <div 
          id="portfolio-modal-root"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div 
            onClick={closeModal}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-[10000] w-full max-w-[1200px] max-h-[90vh]"
          >
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
                <button 
                    onClick={closeModal}
                    className="absolute top-4 right-4 z-30 w-11 h-11 bg-black/50 hover:bg-red-500 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
                    aria-label="Закрыть"
                >
                    <X size={22}/>
                </button>
                
                <div className="md:hidden max-h-[85vh] overflow-y-auto">
                    <div className="w-full aspect-[4/3] relative bg-gradient-to-b from-gray-800 to-gray-900 group">
                        {(() => {
                          const images = getProjectImages(selectedProject);
                          return (
                            <>
                              <img 
                                src={images[currentImageIndex]} 
                                width={800}
                                height={600}
                                className="w-full h-full object-contain transition-opacity duration-300" 
                                alt={selectedProject.title}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/uploads/1764611922746-1__4_.jpeg';
                                }}
                              />
                              {images.length > 1 && (
                                <>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(e); }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-brand-green rounded-full flex items-center justify-center text-white transition-all z-20"
                                  >
                                    <ChevronLeft size={22} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(e); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-brand-green rounded-full flex items-center justify-center text-white transition-all z-20"
                                  >
                                    <ChevronRight size={22} />
                                  </button>
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex gap-2 z-10">
                                    {images.map((_, idx) => (
                                      <button 
                                        type="button" 
                                        key={idx} 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }} 
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-brand-green w-4' : 'bg-white/60 hover:bg-white'}`} 
                                      />
                                    ))}
                                  </div>
                                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs z-10">
                                    {currentImageIndex + 1} / {images.length}
                                  </div>
                                </>
                              )}
                            </>
                          );
                        })()}
                    </div>

                    <div className="p-5">
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {Array.isArray(selectedProject.tags) ? selectedProject.tags.map((t: string) => (
                                <span key={t} className="text-xs font-bold uppercase bg-brand-green/10 text-brand-green-text px-2 py-1 rounded-full">{t}</span>
                            )) : <span className="text-xs font-bold uppercase bg-brand-green/10 text-brand-green-text px-2 py-1 rounded-full">{selectedProject.tags}</span>}
                        </div>
                        
                        <h2 className="text-xl font-bold text-text-primary mb-3">{selectedProject.title}</h2>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-text-secondary mb-4">
                            <div className="flex items-center gap-1">
                                <Ruler size={14} className="text-brand-green"/> 
                                <span>{selectedProject.area}</span>
                            </div>
                            {selectedProject.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin size={14} className="text-brand-green"/> 
                                    <span>{selectedProject.location}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-text-secondary text-sm mb-5">{selectedProject.desc || 'Описание готовится.'}</p>

                        <button 
                            onClick={() => {
                                closeModal();
                                setTimeout(() => {
                                    document.getElementById('calculator')?.scrollIntoView({behavior: 'smooth'});
                                }, 300);
                            }}
                            className="w-full py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors"
                        >
                            Хочу такой ремонт
                        </button>
                    </div>
                </div>
                
                <div className="hidden md:flex">
                    <div className="w-3/5 h-[600px] relative bg-gradient-to-br from-gray-800 via-gray-900 to-black flex-shrink-0 group">
                        {(() => {
                          const images = getProjectImages(selectedProject);
                          return (
                            <>
                              <img 
                                src={images[currentImageIndex]} 
                                width={800}
                                height={600}
                                className="w-full h-full object-contain transition-all duration-300" 
                                alt={selectedProject.title}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/uploads/1764611922746-1__4_.jpeg';
                                }}
                              />
                              {images.length > 1 && (
                                <>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(e); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-brand-green rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
                                  >
                                    <ChevronLeft size={26} />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(e); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-brand-green rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
                                  >
                                    <ChevronRight size={26} />
                                  </button>
                                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm z-10">
                                    {currentImageIndex + 1} / {images.length}
                                  </div>
                                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/40 backdrop-blur-sm p-2 rounded-xl">
                                    {images.map((img, idx) => (
                                      <button 
                                        type="button" 
                                        key={idx} 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }} 
                                        className={`w-14 h-10 rounded-lg overflow-hidden transition-all ${idx === currentImageIndex ? 'ring-2 ring-brand-green scale-105' : 'opacity-60 hover:opacity-100'}`}
                                      >
                                        <img src={img} alt="" width={56} height={40} className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          );
                        })()}
                    </div>

                    <div className="w-2/5 p-8 flex flex-col h-[600px] bg-gradient-to-b from-white to-gray-50">
                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {Array.isArray(selectedProject.tags) ? selectedProject.tags.map((t: string) => (
                                    <span key={t} className="text-xs font-bold uppercase bg-gradient-to-r from-brand-green/20 to-brand-green/10 text-brand-green-text px-3 py-1.5 rounded-full border border-brand-green/20">{t}</span>
                                )) : <span className="text-xs font-bold uppercase bg-gradient-to-r from-brand-green/20 to-brand-green/10 text-brand-green-text px-3 py-1.5 rounded-full border border-brand-green/20">{selectedProject.tags}</span>}
                            </div>
                            
                            <h2 className="text-3xl font-bold text-text-primary mb-5">{selectedProject.title}</h2>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2.5 rounded-xl">
                                    <Ruler size={18} className="text-brand-green"/> 
                                    <span className="font-semibold">{selectedProject.area}</span>
                                </div>
                                {selectedProject.location && (
                                    <div className="flex items-center gap-2 bg-gray-100 px-4 py-2.5 rounded-xl">
                                        <MapPin size={18} className="text-brand-green"/> 
                                        <span className="font-semibold">{selectedProject.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <h4 className="text-text-primary font-bold mb-3 text-lg">О проекте</h4>
                                <p className="text-text-secondary leading-relaxed">{selectedProject.desc || selectedProject.description || 'Описание работ готовится к публикации.'}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                closeModal();
                                setTimeout(() => {
                                    document.getElementById('calculator')?.scrollIntoView({behavior: 'smooth'});
                                }, 300);
                            }}
                            className="w-full py-4 bg-gradient-to-r from-brand-green to-brand-green-dark hover:from-brand-green-dark hover:to-brand-green text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-green/30 hover:shadow-xl hover:shadow-brand-green/40 hover:-translate-y-0.5"
                        >
                            Хочу такой ремонт
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}