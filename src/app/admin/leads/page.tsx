'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Phone, RefreshCw, Trash2, UserPlus, User, ExternalLink } from 'lucide-react';

const COLUMNS = [
  { id: 'new', title: 'Новая заявка', color: 'bg-blue-500' },
  { id: 'call', title: 'Созвон', color: 'bg-yellow-500' },
  { id: 'measure', title: 'Замер', color: 'bg-purple-500' },
  { id: 'contract', title: 'Договор', color: 'bg-green-500' },
];

export default function AdminKanban() {
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [view, setView] = useState<'board' | 'calendar'>('board');
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [creatingClient, setCreatingClient] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      const processed = Array.isArray(data) ? data.map((l: any) => ({ ...l, status: l.status || 'new' })) : [];
      setLeads(processed);
      setLastUpdateTime(new Date().toLocaleTimeString('ru-RU'));
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch clients for orphaned reference handling (Requirements: 5.4)
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  }, []);

  // Check if client exists (Requirements: 5.4)
  const clientExists = (clientUuid: string): boolean => {
    return clients.some(c => c.uuid === clientUuid);
  };

  useEffect(() => {
    setMounted(true);
    fetchLeads();
    fetchClients();
    // Автообновление каждые 10 секунд
    const interval = setInterval(() => {
      fetchLeads();
      fetchClients();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const moveLead = async (id: number, newStatus: string) => {
    const updated = leads.map(l => l.id === id ? { ...l, status: newStatus } : l);
    setLeads(updated);
    try {
      await fetch('/api/leads/update', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }) 
      });
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Удалить заявку?')) return;
    try {
      await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
      setLeads(leads.filter(l => l.id !== id));
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => e.dataTransfer.setData('id', String(id));
  const handleDrop = (e: React.DragEvent, status: string) => {
    const id = Number(e.dataTransfer.getData('id'));
    moveLead(id, status);
  };

  // Parse address from lead comment
  const parseAddressFromComment = (comment: string): string => {
    const match = comment?.match(/Адрес:\s*(.+?)(?:,|$)/i);
    if (match && match[1] && match[1].trim() !== 'Не указан') {
      return match[1].trim();
    }
    return '';
  };

  // Open create client modal (Requirements: 2.1, 2.2)
  const openCreateClientModal = (lead: any) => {
    setSelectedLead(lead);
    setShowCreateClientModal(true);
  };

  // Create client from lead (Requirements: 2.3)
  const handleCreateClient = async (clientData: any) => {
    if (!selectedLead) return;
    
    setCreatingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            name: clientData.name,
            phone: clientData.phone,
            email: clientData.email,
            project: clientData.project,
            address: clientData.address,
            leadId: selectedLead.id,
          }
        })
      });
      
      if (res.ok) {
        const newClient = await res.json();
        // Update local leads state with clientUuid
        setLeads(leads.map(l => 
          l.id === selectedLead.id ? { ...l, clientUuid: newClient.uuid } : l
        ));
        setShowCreateClientModal(false);
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setCreatingClient(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM Система</h1>
          {mounted && (
            <p className="text-gray-500 text-sm mt-1">
              Обновлено: {lastUpdateTime || '—'} • Всего заявок: {leads.length}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchLeads} 
            className="bg-[#0F172A] p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-brand-green transition-colors"
            title="Обновить"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
          <div className="bg-[#0F172A] p-1 rounded-xl border border-white/10 flex">
              <button onClick={() => setView('board')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'board' ? 'bg-brand-green text-white' : 'text-gray-400'}`}>Канбан</button>
              <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'calendar' ? 'bg-brand-green text-white' : 'text-gray-400'}`}>Календарь</button>
          </div>
        </div>
      </div>

      {view === 'board' ? (
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {COLUMNS.map(col => (
                <div 
                    key={col.id} 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className="min-w-[300px] bg-[#0F172A] rounded-2xl border border-white/5 flex flex-col"
                >
                    <div className={`p-4 border-b border-white/5 flex justify-between items-center`}>
                        <span className="font-bold text-white">{col.title}</span>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${col.color}`}>{leads.filter(l => l.status === col.id).length}</span>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                        {leads.filter(l => l.status === col.id).map(lead => (
                            <div 
                                key={lead.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                className="bg-[#1E293B] p-4 rounded-xl cursor-grab active:cursor-grabbing hover:ring-2 ring-brand-green/50 transition-all group relative"
                            >
                                <button 
                                  onClick={() => deleteLead(lead.id)}
                                  className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 p-1 rounded"
                                >
                                  <Trash2 size={14}/>
                                </button>
                                <div className="text-white font-bold mb-1">{lead.name}</div>
                                <div className="text-gray-400 text-sm mb-2 flex items-center gap-2"><Phone size={12}/> {lead.phone}</div>
                                
                                {/* Client badge for leads with linked client (Requirements: 2.4, 5.4) */}
                                {lead.clientUuid && (
                                  clientExists(lead.clientUuid) ? (
                                    <a 
                                      href={`/admin/clients?highlight=${lead.clientUuid}`}
                                      className="flex items-center gap-1 text-xs bg-brand-green/20 text-brand-green px-2 py-1 rounded-lg mb-2 hover:bg-brand-green/30 transition-colors w-fit"
                                    >
                                      <User size={12}/> Клиент создан <ExternalLink size={10}/>
                                    </a>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-lg mb-2 w-fit">
                                      <User size={12}/> Клиент удалён
                                    </span>
                                  )
                                )}
                                
                                {/* Create Client button for measure stage leads without client (Requirements: 2.1) */}
                                {col.id === 'measure' && !lead.clientUuid && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCreateClientModal(lead);
                                    }}
                                    className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg mb-2 hover:bg-purple-500/30 transition-colors w-fit"
                                  >
                                    <UserPlus size={12}/> Создать клиента
                                  </button>
                                )}
                                
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>{new Date(lead.createdAt).toLocaleDateString('ru-RU')}</span>
                                    <span className={`px-2 py-1 rounded text-white ${col.color}`}>{col.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
          </div>
      ) : (
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
             <h2 className="text-xl text-white mb-4">Календарь выездов (Список)</h2>
             <div className="space-y-2">
                {leads.filter(l => l.status === 'measure' || l.type === 'Замер').map(lead => (
                    <div key={lead.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center text-brand-green"><Calendar /></div>
                        <div>
                            <div className="text-white font-bold">{lead.name}</div>
                            <div className="text-gray-400 text-sm">{lead.phone}</div>
                        </div>
                        <div className="ml-auto text-right">
                             <div className="text-white font-bold">10:00</div>
                             <div className="text-gray-500 text-xs">25 Ноября</div>
                        </div>
                    </div>
                ))}
                {leads.filter(l => l.status === 'measure').length === 0 && <div className="text-gray-500">Нет запланированных замеров.</div>}
             </div>
          </div>
      )}

      {/* Create Client Modal (Requirements: 2.2) */}
      {showCreateClientModal && selectedLead && (
        <CreateClientModal
          lead={selectedLead}
          parseAddress={parseAddressFromComment}
          onClose={() => {
            setShowCreateClientModal(false);
            setSelectedLead(null);
          }}
          onSubmit={handleCreateClient}
          loading={creatingClient}
        />
      )}
    </div>
  );
}

// Create Client Modal Component
function CreateClientModal({ 
  lead, 
  parseAddress,
  onClose, 
  onSubmit, 
  loading 
}: { 
  lead: any; 
  parseAddress: (comment: string) => string;
  onClose: () => void; 
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: lead.name || '',
    phone: lead.phone || '',
    email: '',
    project: '',
    address: parseAddress(lead.comment || ''),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">Создать клиента</h2>
        <p className="text-gray-400 text-sm mb-4">Из заявки #{lead.id}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">Телефон *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">Проект</label>
            <input
              type="text"
              value={formData.project}
              onChange={e => setFormData({ ...formData, project: e.target.value })}
              placeholder="Название проекта"
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">Адрес</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-brand-green rounded-xl text-white font-bold hover:bg-brand-green-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}