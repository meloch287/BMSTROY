'use client';
import { useState, useEffect } from 'react';
import { Send, Users, Bot, Settings, History, CheckCircle, XCircle, Clock, Image, FileText, Trash2, Upload } from 'lucide-react';

interface BroadcastMessage {
  id: string;
  text: string;
  imageUrl?: string;
  recipients: string;
  recipientCount: number;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  deliveredCount: number;
}

interface TelegramSettings {
  botToken: string;
  adminUserId: string;
  notifyOnLead: boolean;
  notifyOnApproval: boolean;
}

export default function AdminBroadcast() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'settings'>('compose');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [recipients, setRecipients] = useState('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastMessage[]>([]);
  const [settings, setSettings] = useState<TelegramSettings>({
    botToken: '',
    adminUserId: '',
    notifyOnLead: true,
    notifyOnApproval: true
  });
  const [testingBot, setTestingBot] = useState(false);
  
  // Real counts from data
  const [counts, setCounts] = useState({ all: 0, leads: 0, clients: 0, approved: 0 });

  useEffect(() => {
    // Load settings from server
    fetch('/api/telegram')
      .then(res => res.json())
      .then(data => {
        if (data && data.botToken) {
          setSettings(data);
        }
      })
      .catch(() => {});
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('broadcastHistory');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch {}
    }
    
    // Load real counts
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [leadsRes, clientsRes, estimatesRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/clients'),
        fetch('/api/estimates')
      ]);
      
      const leads = await leadsRes.json();
      const clients = await clientsRes.json();
      const estimates = await estimatesRes.json();
      
      const leadsCount = Array.isArray(leads) ? leads.length : 0;
      const clientsCount = Array.isArray(clients) ? clients.length : 0;
      const approvedCount = Array.isArray(estimates) ? estimates.filter((e: any) => e.approved).length : 0;
      
      setCounts({
        all: leadsCount + clientsCount,
        leads: leadsCount,
        clients: clientsCount,
        approved: approvedCount
      });
    } catch {}
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSettings', settings })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Настройки сохранены!');
      } else {
        alert('❌ Ошибка сохранения');
      }
    } catch {
      alert('❌ Ошибка сохранения');
    }
  };

  const testBot = async () => {
    if (!settings.botToken || !settings.adminUserId) {
      alert('Заполните токен бота и ID администратора');
      return;
    }
    
    setTestingBot(true);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          botToken: settings.botToken,
          chatId: settings.adminUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Тестовое сообщение отправлено!');
      } else {
        alert('❌ Ошибка: ' + (data.error || 'Не удалось отправить'));
      }
    } catch {
      alert('❌ Ошибка подключения');
    }
    setTestingBot(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const sendBroadcast = async () => {
    if (!message) {
      alert('Введите текст сообщения');
      return;
    }
    if (!settings.botToken || !settings.adminUserId) {
      alert('Сначала настройте Telegram бота в разделе "Настройки"');
      setActiveTab('settings');
      return;
    }
    
    setSending(true);
    
    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          imageUrl = window.location.origin + uploadData.url;
        }
      }
      
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          botToken: settings.botToken,
          chatId: settings.adminUserId,
          message,
          imageUrl: imageUrl || undefined
        })
      });
      
      const data = await res.json();
      const recipientCount = getRecipientCount();
      
      const newMessage: BroadcastMessage = {
        id: Date.now().toString(),
        text: message,
        imageUrl: imageUrl || undefined,
        recipients,
        recipientCount,
        sentAt: new Date().toISOString(),
        status: data.success ? 'sent' : 'failed',
        deliveredCount: data.success ? recipientCount : 0
      };
      
      const updatedHistory = [newMessage, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('broadcastHistory', JSON.stringify(updatedHistory));
      
      if (data.success) {
        alert('✅ Рассылка отправлена!');
        setMessage('');
        setImageFile(null);
        setImagePreview('');
      } else {
        alert('❌ Ошибка отправки: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch {
      alert('❌ Ошибка подключения к серверу');
    }
    
    setSending(false);
  };

  const getRecipientCount = () => {
    switch (recipients) {
      case 'all': return counts.all;
      case 'leads': return counts.leads;
      case 'clients': return counts.clients;
      case 'approved': return counts.approved;
      default: return 0;
    }
  };

  const deleteFromHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('broadcastHistory', JSON.stringify(updated));
  };

  const recipientOptions = [
    { value: 'all', label: 'Все контакты', count: counts.all },
    { value: 'leads', label: 'Лиды (новые заявки)', count: counts.leads },
    { value: 'clients', label: 'Активные клиенты', count: counts.clients },
    { value: 'approved', label: 'Согласовавшие смету', count: counts.approved }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Bot className="text-blue-400"/> Telegram Рассылка
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
            activeTab === 'compose'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Send size={18}/> Новая рассылка
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <History size={18}/> История
          {history.length > 0 && (
            <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Settings size={18}/> Настройки бота
        </button>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                <Bot size={24}/>
              </div>
              <div>
                <h3 className="text-white font-bold">Новое сообщение</h3>
                <p className="text-gray-500 text-sm">Отправка через Telegram Bot API</p>
              </div>
            </div>

            {/* Recipients */}
            <div className="mb-6">
              <label className="text-gray-500 text-sm mb-2 block flex items-center gap-2">
                <Users size={14}/> Получатели
              </label>
              <select 
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500"
              >
                {recipientOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="text-gray-500 text-sm mb-2 block flex items-center gap-2">
                <FileText size={14}/> Текст сообщения
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Здравствуйте! 👋&#10;&#10;У нас для вас отличные новости..."
                className="w-full bg-[#020617] border border-white/10 p-4 rounded-xl text-white h-40 resize-none outline-none focus:border-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Поддерживается Markdown и эмодзи</span>
                <span>{message.length} символов</span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="text-gray-500 text-sm mb-2 block flex items-center gap-2">
                <Image size={14}/> Изображение (необязательно)
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-32 rounded-xl border border-white/10"/>
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Upload size={20} className="text-gray-500"/>
                  <span className="text-gray-500">Выбрать изображение</span>
                </label>
              )}
            </div>

            {/* Quick Templates */}
            <div className="mb-6">
              <label className="text-gray-500 text-sm mb-2 block">Быстрые шаблоны</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🎉 Акция', text: '🎉 *Специальное предложение!*\n\nТолько до конца месяца скидка 15% на все виды работ!\n\n📞 Звоните: +7 (999) 000-00-00' },
                  { label: '📢 Новость', text: '📢 *Новости компании*\n\nМы рады сообщить...\n\nПодробности на сайте!' },
                  { label: '⏰ Напоминание', text: '⏰ *Напоминание*\n\nНе забудьте о нашей встрече!\n\nЕсли есть вопросы — пишите.' }
                ].map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(tpl.text)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={sendBroadcast}
              disabled={sending || !message || getRecipientCount() === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Отправка...
                </>
              ) : (
                <>
                  <Send size={20}/> Отправить рассылку ({getRecipientCount()} получателей)
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="hidden lg:block">
            <div className="bg-[#0e1621] rounded-3xl p-4 max-w-[380px] mx-auto border border-white/10">
              <div className="bg-[#17212b] rounded-2xl overflow-hidden">
                <div className="bg-[#242f3d] p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">БМ</div>
                  <div>
                    <div className="text-white font-medium">БМСтрой Бот</div>
                    <div className="text-gray-400 text-xs">бот</div>
                  </div>
                </div>
                <div className="p-4 min-h-[400px] bg-[#0e1621]">
                  {message ? (
                    <div className="max-w-[85%]">
                      {imagePreview && (
                        <div className="bg-[#182533] rounded-t-xl overflow-hidden mb-0.5">
                          <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover"/>
                        </div>
                      )}
                      <div className={`bg-[#182533] p-3 text-white text-sm ${imagePreview ? 'rounded-b-xl' : 'rounded-xl'}`}>
                        <div className="whitespace-pre-wrap">{message}</div>
                        <div className="text-[10px] text-gray-500 text-right mt-2 flex items-center justify-end gap-1">
                          {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          <CheckCircle size={12} className="text-blue-400"/>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-20">
                      <Bot size={48} className="mx-auto mb-4 opacity-30"/>
                      <p>Введите текст сообщения<br/>для предпросмотра</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <History size={48} className="mx-auto mb-4 opacity-50"/>
              <p>История рассылок пуста</p>
            </div>
          ) : (
            history.map(msg => (
              <div key={msg.id} className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      msg.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                      msg.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {msg.status === 'sent' ? <CheckCircle size={20}/> :
                       msg.status === 'failed' ? <XCircle size={20}/> :
                       <Clock size={20}/>}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {msg.status === 'sent' ? 'Отправлено' : msg.status === 'failed' ? 'Ошибка' : 'В очереди'}
                      </div>
                      <div className="text-gray-500 text-sm">{new Date(msg.sentAt).toLocaleString('ru-RU')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-full">
                      {msg.deliveredCount}/{msg.recipientCount} доставлено
                    </span>
                    <button onClick={() => deleteFromHistory(msg.id)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
                <div className="bg-[#020617] p-4 rounded-xl text-gray-300 text-sm whitespace-pre-wrap">{msg.text}</div>
                {msg.imageUrl && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Image size={12}/> С изображением</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 mb-6">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Bot size={20} className="text-blue-400"/> Настройки Telegram бота
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-gray-500 text-sm mb-2 block">Bot Token</label>
                <input
                  type="password"
                  value={settings.botToken}
                  onChange={e => setSettings({...settings, botToken: e.target.value})}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">Получите токен у @BotFather в Telegram</p>
              </div>
              
              <div>
                <label className="text-gray-500 text-sm mb-2 block">ID администратора</label>
                <input
                  type="text"
                  value={settings.adminUserId}
                  onChange={e => setSettings({...settings, adminUserId: e.target.value})}
                  placeholder="123456789"
                  className="w-full bg-[#020617] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">Ваш личный ID в Telegram. Узнать можно через @userinfobot</p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={testBot}
                  disabled={testingBot}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {testingBot ? 'Проверка...' : '🧪 Тест подключения'}
                </button>
                <button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors">
                  💾 Сохранить настройки
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-white/5">
            <h3 className="text-white font-bold text-lg mb-6">🔔 Автоматические уведомления</h3>
            <p className="text-gray-500 text-sm mb-6">Бот будет отправлять вам уведомления о важных событиях</p>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-[#020617] rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <div className="text-white font-medium">Новая заявка</div>
                  <div className="text-gray-500 text-sm">Уведомление при новом лиде с сайта</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnLead}
                  onChange={e => setSettings({...settings, notifyOnLead: e.target.checked})}
                  className="w-5 h-5 accent-blue-500"
                />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-[#020617] rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <div className="text-white font-medium">Согласование сметы</div>
                  <div className="text-gray-500 text-sm">Когда клиент согласовывает смету</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnApproval}
                  onChange={e => setSettings({...settings, notifyOnApproval: e.target.checked})}
                  className="w-5 h-5 accent-blue-500"
                />
              </label>
            </div>
            
            <button onClick={saveSettings} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors">
              💾 Сохранить настройки уведомлений
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
