'use client';
import { useState, useEffect } from 'react';
import { UserPlus, ExternalLink, Copy, Trash2, Image, Plus, X, Upload, Calendar, Pencil, ChevronDown, ChevronUp, FileText, Phone as PhoneIcon } from 'lucide-react';

interface Report {
  title: string;
  date: string;
  comment: string;
  photos: string[];
}

interface Lead {
  id: number;
  name: string;
  phone: string;
  type: string;
  createdAt: string;
}

interface Estimate {
  uuid: string;
  clientName: string;
  clientPhone?: string;
  clientUuid?: string;
  items: any[];
  approved: boolean;
  approvedAt?: string;
  createdAt: string;
}

interface Client {
  uuid: string;
  name: string;
  phone?: string;
  email?: string;
  project: string;
  address?: string;
  leadId?: number;
  estimateUuid?: string;
  progress?: number;
  currentStage?: string;
  reports: Report[];
  createdAt?: string;
}

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [newClient, setNewClient] = useState({ name: '', project: '' });
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [addingReport, setAddingReport] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newReport, setNewReport] = useState<Report>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
    photos: []
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(data => { 
      if(Array.isArray(data)) setClients(data);
    });
    // Fetch leads to display source lead info (Requirements: 4.1)
    fetch('/api/leads').then(res => res.json()).then(data => {
      if(Array.isArray(data)) setLeads(data);
    });
    // Fetch estimates to display linked estimates (Requirements: 4.2)
    fetch('/api/estimates').then(res => res.json()).then(data => {
      if(Array.isArray(data)) setEstimates(data);
    });
  }, []);

  // Get source lead for a client
  const getSourceLead = (leadId?: number): Lead | undefined => {
    if (!leadId) return undefined;
    return leads.find(l => l.id === leadId);
  };

  // Get linked estimate for a client (Requirements: 4.2)
  const getClientEstimate = (clientUuid: string): Estimate | undefined => {
    return estimates.find(e => e.clientUuid === clientUuid);
  };

  const createClient = async () => {
    if (!newClient.name) return;
    const res = await fetch('/api/clients', { 
      method: 'POST', 
      body: JSON.stringify({ action: 'create', data: newClient }) 
    });
    const created = await res.json();
    setClients([created, ...clients]);
    setNewClient({ name: '', project: '' });
  };

  const updateClient = async (client: Client) => {
    await fetch('/api/clients', {
      method: 'PUT',
      body: JSON.stringify({ uuid: client.uuid, data: client })
    });
    setClients(prev => prev.map(c => c.uuid === client.uuid ? client : c));
    setEditingClient(null);
  };

  const deleteClient = async (uuid: string) => {
    const client = clients.find(c => c.uuid === uuid);
    const linkedEstimate = client ? getClientEstimate(uuid) : null;
    
    // Build warning message with linked data info (Requirements: 5.1)
    let warningMessage = 'Удалить клиента и все его данные?';
    if (linkedEstimate) {
      const total = linkedEstimate.items?.reduce((a: number, i: any) => a + Number(i.price || 0), 0) || 0;
      warningMessage = `⚠️ У клиента есть связанная смета на ${total.toLocaleString()} ₽!\n\nУдалить клиента? Смета будет отвязана от клиента.`;
    }
    
    if (!confirm(warningMessage)) return;
    await fetch(`/api/clients?uuid=${uuid}`, { method: 'DELETE' });
    setClients(prev => prev.filter(c => c.uuid !== uuid));
  };

  const copyLink = (uuid: string) => {
    const link = `${window.location.origin}/client/${uuid}`;
    navigator.clipboard.writeText(link);
    alert('Секретная ссылка скопирована!');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    
    setNewReport(prev => ({ ...prev, photos: [...prev.photos, ...uploadedUrls] }));
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setNewReport(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addReport = async (clientUuid: string) => {
    if (!newReport.title) return;
    
    const client = clients.find(c => c.uuid === clientUuid);
    if (!client) return;
    
    const updatedClient = {
      ...client,
      reports: [newReport, ...(client.reports || [])]
    };
    
    await fetch('/api/clients', {
      method: 'PUT',
      body: JSON.stringify({ uuid: clientUuid, data: updatedClient })
    });
    
    setClients(prev => prev.map(c => c.uuid === clientUuid ? updatedClient : c));
    setAddingReport(null);
    setNewReport({ title: '', date: new Date().toISOString().split('T')[0], comment: '', photos: [] });
  };

  const deleteReport = async (clientUuid: string, reportIndex: number) => {
    if (!confirm('Удалить этот отчёт?')) return;
    
    const client = clients.find(c => c.uuid === clientUuid);
    if (!client) return;
    
    const updatedClient = {
      ...client,
      reports: client.reports.filter((_, i) => i !== reportIndex)
    };
    
    await fetch('/api/clients', {
      method: 'PUT',
      body: JSON.stringify({ uuid: clientUuid, data: updatedClient })
    });
    
    setClients(prev => prev.map(c => c.uuid === clientUuid ? updatedClient : c));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Клиентские порталы</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* New Client Form */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 h-fit">
          <h3 className="text-white font-bold mb-4">Новый клиент</h3>
          <div className="space-y-4">
            <input 
              placeholder="ФИО Клиента" 
              value={newClient.name} 
              onChange={e => setNewClient({...newClient, name: e.target.value})} 
              className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
            />
            <input 
              placeholder="Название проекта (ЖК, адрес)" 
              value={newClient.project} 
              onChange={e => setNewClient({...newClient, project: e.target.value})} 
              className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
            />
            <button 
              onClick={createClient} 
              disabled={!newClient.name}
              className="w-full bg-brand-green hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex justify-center gap-2"
            >
              <UserPlus size={20}/> Создать доступ
            </button>
          </div>
        </div>

        {/* Clients List */}
        <div className="lg:col-span-2 space-y-4">
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserPlus size={48} className="mx-auto mb-4 opacity-50"/>
              <p>Клиентов пока нет</p>
            </div>
          ) : (
            clients.map(client => (
              <div key={client.uuid} className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
                {/* Client Header */}
                <div className="p-6 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-white font-bold text-lg">{client.name}</span>
                      <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-0.5 rounded">
                        {client.reports?.length || 0} отчётов
                      </span>
                      {/* Estimate badge (Requirements: 4.1) */}
                      {client.estimateUuid && (
                        <a 
                          href={`/admin/estimates`}
                          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-blue-500/30"
                        >
                          <FileText size={10}/> Смета
                        </a>
                      )}
                    </div>
                    <div className="text-gray-500">{client.project}</div>
                    
                    {/* Contact info */}
                    {client.phone && (
                      <div className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                        <PhoneIcon size={12}/> {client.phone}
                      </div>
                    )}
                    
                    {/* Source lead info (Requirements: 4.1, 5.4 - orphaned reference handling) */}
                    {client.leadId && (
                      <div className="mt-2">
                        {(() => {
                          const sourceLead = getSourceLead(client.leadId);
                          return sourceLead ? (
                            <a 
                              href="/admin/leads"
                              className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-purple-500/30"
                            >
                              Из заявки: {sourceLead.type} от {new Date(sourceLead.createdAt).toLocaleDateString('ru-RU')}
                            </a>
                          ) : (
                            <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded inline-flex items-center gap-1">
                              Заявка удалена
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600 font-mono mt-2">{client.uuid}</div>
                    
                    {/* Progress */}
                    {client.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Прогресс</span>
                          <span className="text-white font-medium">{client.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-green transition-all" 
                            style={{ width: `${client.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Linked Estimate Section (Requirements: 4.2, 5.4 - orphaned reference handling) */}
                    {(() => {
                      const estimate = getClientEstimate(client.uuid);
                      // Show orphaned reference message if client has estimateUuid but estimate not found
                      if (!estimate && client.estimateUuid) {
                        return (
                          <div className="mt-3 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <FileText size={14}/> Смета удалена
                            </span>
                          </div>
                        );
                      }
                      if (!estimate) return null;
                      const total = estimate.items?.reduce((a: number, i: any) => a + Number(i.price || 0), 0) || 0;
                      return (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <FileText size={14}/> Смета
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${estimate.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {estimate.approved ? 'Согласована' : 'На согласовании'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{total.toLocaleString()} ₽</span>
                            <a 
                              href={`/estimate/${estimate.uuid}`}
                              target="_blank"
                              className="text-xs text-brand-green hover:underline flex items-center gap-1"
                            >
                              Открыть <ExternalLink size={10}/>
                            </a>
                          </div>
                          {estimate.approvedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Согласована {new Date(estimate.approvedAt).toLocaleDateString('ru-RU')}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={() => setEditingClient(client)}
                      className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-500/30"
                      title="Редактировать"
                    >
                      <Pencil size={16}/>
                    </button>
                    <button 
                      onClick={() => copyLink(client.uuid)} 
                      className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg"
                      title="Скопировать ссылку"
                    >
                      <Copy size={16}/>
                    </button>
                    <a 
                      href={`/client/${client.uuid}`} 
                      target="_blank" 
                      className="bg-brand-green/20 text-brand-green px-3 py-2 rounded-lg hover:bg-brand-green/30"
                      title="Открыть кабинет"
                    >
                      <ExternalLink size={16}/>
                    </a>
                    <button 
                      onClick={() => deleteClient(client.uuid)}
                      className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30"
                      title="Удалить"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>

                {/* Expand/Collapse Reports */}
                <button
                  onClick={() => setExpandedClient(expandedClient === client.uuid ? null : client.uuid)}
                  className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 flex items-center justify-between text-sm text-gray-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Image size={16}/> Фотоотчёты ({client.reports?.length || 0})
                  </span>
                  {expandedClient === client.uuid ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>

                {/* Reports Section */}
                {expandedClient === client.uuid && (
                  <div className="p-6 border-t border-white/5 space-y-4">
                    {/* Add Report Button */}
                    {addingReport !== client.uuid ? (
                      <button
                        onClick={() => setAddingReport(client.uuid)}
                        className="w-full py-3 border border-dashed border-brand-green/30 rounded-xl text-brand-green hover:bg-brand-green/10 flex items-center justify-center gap-2"
                      >
                        <Plus size={18}/> Добавить фотоотчёт
                      </button>
                    ) : (
                      /* Add Report Form */
                      <div className="bg-[#020617] p-4 rounded-xl border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-white font-medium">Новый фотоотчёт</h4>
                          <button onClick={() => setAddingReport(null)} className="text-gray-400 hover:text-white">
                            <X size={18}/>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            placeholder="Заголовок отчёта"
                            value={newReport.title}
                            onChange={e => setNewReport({...newReport, title: e.target.value})}
                            className="bg-[#0F172A] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-brand-green"
                          />
                          <input
                            type="date"
                            value={newReport.date}
                            onChange={e => setNewReport({...newReport, date: e.target.value})}
                            className="bg-[#0F172A] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-brand-green"
                          />
                        </div>
                        
                        <textarea
                          placeholder="Комментарий к отчёту..."
                          value={newReport.comment}
                          onChange={e => setNewReport({...newReport, comment: e.target.value})}
                          rows={3}
                          className="w-full bg-[#0F172A] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-brand-green resize-none"
                        />
                        
                        {/* Photo Upload */}
                        <div>
                          <label className="text-gray-500 text-sm mb-2 block">Фотографии</label>
                          <div className="flex flex-wrap gap-3">
                            {newReport.photos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                <img src={photo} className="w-24 h-24 object-cover rounded-lg border border-white/10"/>
                                <button
                                  onClick={() => removePhoto(idx)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12}/>
                                </button>
                              </div>
                            ))}
                            <label className="w-24 h-24 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-green/50 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                              {uploading ? (
                                <div className="animate-spin w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full"/>
                              ) : (
                                <>
                                  <Upload size={20} className="text-gray-500 mb-1"/>
                                  <span className="text-xs text-gray-500">Загрузить</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => addReport(client.uuid)}
                          disabled={!newReport.title}
                          className="w-full bg-brand-green hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
                        >
                          Сохранить отчёт
                        </button>
                      </div>
                    )}

                    {/* Reports List */}
                    {client.reports && client.reports.length > 0 ? (
                      client.reports.map((report, idx) => (
                        <div key={idx} className="bg-[#020617] p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-white font-medium">{report.title}</div>
                              <div className="text-gray-500 text-sm flex items-center gap-1">
                                <Calendar size={12}/> {new Date(report.date).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteReport(client.uuid, idx)}
                              className="text-red-400 hover:bg-red-500/20 p-2 rounded"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                          {report.comment && (
                            <p className="text-gray-400 text-sm mb-3">{report.comment}</p>
                          )}
                          {report.photos && report.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {report.photos.map((photo, pIdx) => (
                                <img 
                                  key={pIdx} 
                                  src={photo} 
                                  className="w-20 h-20 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Отчётов пока нет
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/10 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">Редактировать клиента</h3>
              <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-white">
                <X size={20}/>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-500 text-sm mb-1 block">ФИО</label>
                <input
                  value={editingClient.name}
                  onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Проект</label>
                <input
                  value={editingClient.project}
                  onChange={e => setEditingClient({...editingClient, project: e.target.value})}
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Прогресс (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingClient.progress || 0}
                  onChange={e => setEditingClient({...editingClient, progress: Number(e.target.value)})}
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-gray-500 text-sm mb-1 block">Текущий этап</label>
                <input
                  value={editingClient.currentStage || ''}
                  onChange={e => setEditingClient({...editingClient, currentStage: e.target.value})}
                  placeholder="Например: Черновая электрика"
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-brand-green"
                />
              </div>
              
              <button
                onClick={() => updateClient(editingClient)}
                className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3 rounded-xl"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
