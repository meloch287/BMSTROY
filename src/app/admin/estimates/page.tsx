'use client';
import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Copy, Trash2, Pencil, X, FileSpreadsheet, Check, Clock, CheckCircle2, Users, ChevronDown, Search } from 'lucide-react';

interface Client {
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  project?: string;
}

interface EstimateItem {
  name: string;
  description: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  price: number;
  isOptional: boolean;
}

interface Estimate {
  uuid: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  address: string;
  items: EstimateItem[];
  approved: boolean;
  approvedAt?: string;
  paymentMethod?: 'cash' | 'card';
  clientUuid?: string;
  createdAt: string;
}

export default function AdminEstimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingEst, setEditingEst] = useState<Estimate | null>(null);
  const [selectedClientUuid, setSelectedClientUuid] = useState<string | null>(null);
  const [clientMode, setClientMode] = useState<'select' | 'new'>('new');
  const [newEst, setNewEst] = useState({
    clientName: '',
    clientPhone: '+7',
    clientEmail: '',
    address: '',
    items: [] as EstimateItem[]
  });

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
    setNewEst({ ...newEst, clientPhone: formatPhone(value) });
  };

  const isPhoneValid = (phone: string) => {
    return phone.replace(/\D/g, '').length === 11;
  };

  useEffect(() => {
    fetch('/api/estimates').then(res => res.json()).then(data => { 
      if(Array.isArray(data)) setEstimates(data);
    });
    // Fetch clients for selector (Requirements: 3.1)
    fetch('/api/clients').then(res => res.json()).then(data => {
      if(Array.isArray(data)) setClients(data);
    });
  }, []);

  // Auto-fill form when client is selected (Requirements: 3.2)
  const handleClientSelect = (clientUuid: string | null) => {
    setSelectedClientUuid(clientUuid);
    if (clientUuid) {
      const client = clients.find(c => c.uuid === clientUuid);
      if (client) {
        setNewEst({
          ...newEst,
          clientName: client.name,
          clientPhone: client.phone ? formatPhone(client.phone) : '+7',
          clientEmail: client.email || '',
          address: client.address || '',
        });
        setClientMode('select');
      }
    } else {
      setClientMode('new');
    }
  };

  const pendingEstimates = estimates.filter(e => !e.approved);
  const approvedEstimates = estimates.filter(e => e.approved);

  const createEmptyItem = (): EstimateItem => ({
    name: '',
    description: '',
    unit: 'шт',
    quantity: 1,
    pricePerUnit: 0,
    price: 0,
    isOptional: false
  });

  const addItem = () => {
    setNewEst({ ...newEst, items: [...newEst.items, createEmptyItem()] });
  };

  const updateItem = (index: number, field: keyof EstimateItem, value: any) => {
    const updatedItems = [...newEst.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate price
    if (field === 'quantity' || field === 'pricePerUnit') {
      updatedItems[index].price = updatedItems[index].quantity * updatedItems[index].pricePerUnit;
    }
    
    setNewEst({ ...newEst, items: updatedItems });
  };

  const removeItem = (index: number) => {
    setNewEst({ ...newEst, items: newEst.items.filter((_, i) => i !== index) });
  };

  const createEstimate = async () => {
    let clientUuid = selectedClientUuid;
    
    // If "create new" mode, create client first (Requirements: 3.3)
    if (clientMode === 'new' && newEst.clientName) {
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            name: newEst.clientName,
            phone: newEst.clientPhone,
            email: newEst.clientEmail,
            address: newEst.address,
            project: `Смета от ${new Date().toLocaleDateString('ru-RU')}`,
          }
        })
      });
      if (clientRes.ok) {
        const newClient = await clientRes.json();
        clientUuid = newClient.uuid;
        setClients(prev => [newClient, ...prev]);
      }
    }
    
    // Create estimate with clientUuid (Requirements: 3.4)
    const res = await fetch('/api/estimates', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'create', 
        data: { ...newEst, clientUuid } 
      }) 
    });
    const created = await res.json();
    
    // Update client with estimateUuid for bidirectional link (Requirements: 3.4)
    if (clientUuid && created.uuid) {
      await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: clientUuid,
          data: { estimateUuid: created.uuid }
        })
      });
    }
    
    setEstimates(prev => [created, ...prev]);
    setIsBuilding(false);
    resetForm();
  };

  const handleEdit = (est: Estimate) => {
    setEditingEst(est);
    setNewEst({
      clientName: est.clientName,
      clientPhone: est.clientPhone ? formatPhone(est.clientPhone) : '+7',
      clientEmail: est.clientEmail || '',
      address: est.address || '',
      items: est.items.map(item => ({
        name: item.name,
        description: item.description || '',
        unit: item.unit || 'шт',
        quantity: item.quantity || 1,
        pricePerUnit: item.pricePerUnit || item.price,
        price: item.price,
        isOptional: item.isOptional
      }))
    });
    setIsBuilding(false);
  };

  const handleSaveEdit = async () => {
    await fetch('/api/estimates', { 
      method: 'PUT', 
      body: JSON.stringify({ uuid: editingEst!.uuid, data: newEst }) 
    });
    setEstimates(prev => prev.map(e => 
      e.uuid === editingEst!.uuid ? { ...e, ...newEst } : e
    ));
    setEditingEst(null);
    resetForm();
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Удалить смету?')) return;
    await fetch(`/api/estimates?uuid=${uuid}`, { method: 'DELETE' });
    setEstimates(prev => prev.filter(e => e.uuid !== uuid));
  };

  const resetForm = () => {
    setNewEst({ clientName: '', clientPhone: '+7', clientEmail: '', address: '', items: [] });
    setSelectedClientUuid(null);
    setClientMode('new');
  };

  const cancelEdit = () => {
    setEditingEst(null);
    resetForm();
  };

  const copyLink = (uuid: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/estimate/${uuid}`);
    alert('Ссылка скопирована!');
  };

  const total = newEst.items.reduce((acc, item) => acc + Number(item.price || 0), 0);
  const requiredTotal = newEst.items.filter(i => !i.isOptional).reduce((acc, item) => acc + Number(item.price || 0), 0);

  const displayEstimates = activeTab === 'pending' ? pendingEstimates : approvedEstimates;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Интерактивные сметы</h1>
        <button 
          onClick={() => { setIsBuilding(!isBuilding); setEditingEst(null); resetForm(); }} 
          className="bg-brand-green text-white px-4 py-2 rounded-xl font-bold flex gap-2 items-center"
        >
          <Plus size={20}/> {isBuilding ? 'Отмена' : 'Создать смету'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
            activeTab === 'pending' 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Clock size={18}/> На согласовании
          {pendingEstimates.length > 0 && (
            <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingEstimates.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
            activeTab === 'approved' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <CheckCircle2 size={18}/> Согласованные
          {approvedEstimates.length > 0 && (
            <span className="bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
              {approvedEstimates.length}
            </span>
          )}
        </button>
      </div>

      {/* Form */}
      {(isBuilding || editingEst) && (
        <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {editingEst ? 'Редактирование сметы' : 'Конструктор сметы'}
            </h2>
            {editingEst && (
              <button onClick={cancelEdit} className="text-gray-400 hover:text-white">
                <X size={20}/>
              </button>
            )}
          </div>

          {/* Client Selector (Requirements: 3.1) */}
          <ClientSelector
            clients={clients}
            selectedClientUuid={selectedClientUuid}
            onSelect={handleClientSelect}
            clientMode={clientMode}
            setClientMode={setClientMode}
          />

          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-gray-500 text-sm mb-1 block">ФИО клиента *</label>
              <input 
                placeholder="Иванов Иван Иванович" 
                value={newEst.clientName} 
                onChange={e => setNewEst({...newEst, clientName: e.target.value})} 
                className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green"
                disabled={clientMode === 'select'}
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm mb-1 block">Телефон *</label>
              <input 
                type="tel"
                placeholder="+7 (999) 123-45-67" 
                value={newEst.clientPhone} 
                onChange={e => handlePhoneChange(e.target.value)} 
                className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green disabled:opacity-60"
                disabled={clientMode === 'select'}
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm mb-1 block">Email</label>
              <input 
                placeholder="client@email.com" 
                value={newEst.clientEmail} 
                onChange={e => setNewEst({...newEst, clientEmail: e.target.value})} 
                className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green disabled:opacity-60"
                disabled={clientMode === 'select'}
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm mb-1 block">Адрес объекта</label>
              <input 
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 10" 
                value={newEst.address} 
                onChange={e => setNewEst({...newEst, address: e.target.value})} 
                className="bg-[#020617] border border-white/10 p-3 rounded-xl text-white w-full outline-none focus:border-brand-green"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <h3 className="text-white font-medium mb-3">Работы и материалы</h3>
          </div>
          
          <div className="space-y-4 mb-6">
            {newEst.items.map((item, idx) => (
              <div key={idx} className="bg-[#020617] p-4 rounded-xl border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Name & Description */}
                  <div className="md:col-span-4">
                    <input 
                      value={item.name} 
                      onChange={e => updateItem(idx, 'name', e.target.value)} 
                      placeholder="Название работы *" 
                      className="w-full bg-transparent text-white outline-none border-b border-white/10 pb-2 mb-2 focus:border-brand-green"
                    />
                    <textarea 
                      value={item.description} 
                      onChange={e => updateItem(idx, 'description', e.target.value)} 
                      placeholder="Описание (необязательно)" 
                      rows={2}
                      className="w-full bg-transparent text-gray-400 text-sm outline-none resize-none"
                    />
                  </div>
                  
                  {/* Unit */}
                  <div className="md:col-span-2">
                    <label className="text-gray-600 text-xs block mb-1">Ед. изм.</label>
                    <select 
                      value={item.unit} 
                      onChange={e => updateItem(idx, 'unit', e.target.value)}
                      className="w-full bg-[#0F172A] text-white p-2 rounded border border-white/10 outline-none"
                    >
                      <option value="шт">шт</option>
                      <option value="м²">м²</option>
                      <option value="м³">м³</option>
                      <option value="п.м.">п.м.</option>
                      <option value="компл.">компл.</option>
                      <option value="услуга">услуга</option>
                    </select>
                  </div>
                  
                  {/* Quantity */}
                  <div className="md:col-span-1">
                    <label className="text-gray-600 text-xs block mb-1">Кол-во</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.1"
                      value={item.quantity} 
                      onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} 
                      className="w-full bg-[#0F172A] text-white p-2 rounded border border-white/10 outline-none text-center"
                    />
                  </div>
                  
                  {/* Price per unit */}
                  <div className="md:col-span-2">
                    <label className="text-gray-600 text-xs block mb-1">Цена за ед.</label>
                    <input 
                      type="number" 
                      min="0"
                      value={item.pricePerUnit} 
                      onChange={e => updateItem(idx, 'pricePerUnit', Number(e.target.value))} 
                      className="w-full bg-[#0F172A] text-white p-2 rounded border border-white/10 outline-none text-right"
                    />
                  </div>
                  
                  {/* Total */}
                  <div className="md:col-span-2">
                    <label className="text-gray-600 text-xs block mb-1">Сумма</label>
                    <div className="text-white font-bold p-2 text-right">
                      {item.price.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="md:col-span-1 flex flex-col gap-2 items-end">
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input 
                        type="checkbox" 
                        checked={item.isOptional} 
                        onChange={e => updateItem(idx, 'isOptional', e.target.checked)} 
                        className="w-4 h-4 accent-brand-green"
                      />
                      <span className="text-gray-400">Опция</span>
                    </label>
                    <button 
                      onClick={() => removeItem(idx)} 
                      className="text-red-500 hover:bg-red-500/10 p-2 rounded"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={addItem} 
              className="text-brand-green hover:bg-brand-green/10 px-4 py-2 rounded-lg text-sm flex items-center gap-1 border border-brand-green/30"
            >
              <Plus size={14}/> Добавить работу
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-center border-t border-white/5 pt-6">
            <div className="space-y-1">
              <div className="text-gray-400 text-sm">
                Обязательные работы: <span className="text-white font-medium">{requiredTotal.toLocaleString()} ₽</span>
              </div>
              <div className="text-gray-400">
                Итого со всеми опциями: <span className="text-white font-bold text-xl">{total.toLocaleString()} ₽</span>
              </div>
            </div>
            <button 
              onClick={editingEst ? handleSaveEdit : createEstimate} 
              disabled={!newEst.clientName || !isPhoneValid(newEst.clientPhone) || newEst.items.length === 0}
              className="bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl shadow-lg"
            >
              {editingEst ? 'Сохранить изменения' : 'Сохранить и получить ссылку'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {displayEstimates.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50"/>
          <p>{activeTab === 'pending' ? 'Нет смет на согласовании' : 'Нет согласованных смет'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayEstimates.map(est => (
            <div 
              key={est.uuid} 
              className={`bg-[#0F172A] p-6 rounded-2xl border transition-all ${
                est.approved 
                  ? 'border-green-500/20 hover:border-green-500/40' 
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-white text-lg">{est.clientName}</span>
                    {est.approved && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check size={12}/> Согласована {est.approvedAt && `• ${new Date(est.approvedAt).toLocaleDateString('ru-RU')}`}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    {est.clientPhone && (
                      <div>
                        <span className="text-gray-500">Телефон:</span>
                        <span className="text-white ml-2">{est.clientPhone}</span>
                      </div>
                    )}
                    {est.clientEmail && (
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="text-white ml-2">{est.clientEmail}</span>
                      </div>
                    )}
                    {est.address && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Адрес:</span>
                        <span className="text-white ml-2">{est.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-gray-500 text-sm">
                    {est.items?.length || 0} позиций • 
                    <span className="text-white font-medium ml-1">
                      {est.items?.reduce((a: number, i: EstimateItem) => a + Number(i.price || 0), 0).toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-600 mt-1">{est.uuid}</div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleEdit(est)} 
                    className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-500/30"
                    title="Редактировать"
                  >
                    <Pencil size={16}/>
                  </button>
                  <button 
                    onClick={() => copyLink(est.uuid)} 
                    className="bg-white/5 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-white/10"
                  >
                    <Copy size={16}/> Ссылка
                  </button>
                  <a 
                    href={`/estimate/${est.uuid}`} 
                    target="_blank" 
                    className="bg-brand-green/20 text-brand-green px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-brand-green/30"
                  >
                    <ExternalLink size={16}/> Открыть
                  </a>
                  <button 
                    onClick={() => handleDelete(est.uuid)} 
                    className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30"
                    title="Удалить"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Client Selector Component (Requirements: 3.1)
function ClientSelector({
  clients,
  selectedClientUuid,
  onSelect,
  clientMode,
  setClientMode,
}: {
  clients: Client[];
  selectedClientUuid: string | null;
  onSelect: (uuid: string | null) => void;
  clientMode: 'select' | 'new';
  setClientMode: (mode: 'select' | 'new') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const selectedClient = clients.find(c => c.uuid === selectedClientUuid);

  return (
    <div className="mb-6">
      <label className="text-gray-500 text-sm mb-2 block">Клиент</label>
      
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            setClientMode('new');
            onSelect(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            clientMode === 'new'
              ? 'bg-brand-green text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Новый клиент
        </button>
        <button
          type="button"
          onClick={() => setClientMode('select')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            clientMode === 'select'
              ? 'bg-brand-green text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Users size={16}/> Выбрать существующего
        </button>
      </div>

      {/* Client Dropdown */}
      {clientMode === 'select' && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white flex justify-between items-center hover:border-brand-green/50 transition-colors"
          >
            <span className={selectedClient ? 'text-white' : 'text-gray-500'}>
              {selectedClient ? `${selectedClient.name} • ${selectedClient.phone}` : 'Выберите клиента...'}
            </span>
            <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-xl overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input
                    type="text"
                    placeholder="Поиск по имени или телефону..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#020617] border border-white/10 pl-10 pr-4 py-2 rounded-lg text-white text-sm outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Client List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {clients.length === 0 ? 'Нет клиентов' : 'Клиенты не найдены'}
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <button
                      key={client.uuid}
                      type="button"
                      onClick={() => {
                        onSelect(client.uuid);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                        selectedClientUuid === client.uuid ? 'bg-brand-green/10' : ''
                      }`}
                    >
                      <div className="text-white font-medium">{client.name}</div>
                      <div className="text-gray-400 text-sm">{client.phone}</div>
                      {client.project && (
                        <div className="text-gray-500 text-xs mt-1">{client.project}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
