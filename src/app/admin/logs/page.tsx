'use client';
import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, User, Clock, Filter, X, Calendar, Database, Activity } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp?: string;
  action?: 'create' | 'update' | 'delete';
  collection?: string;
  recordId?: number;
  user: string;
  details?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: string;
  };
  date?: string;
  createdAt?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [actionFilter, setActionFilter] = useState<string>('');
  const [collectionFilter, setCollectionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch unique collections for filter dropdown
  useEffect(() => {
    fetch('/api/logs?collections=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCollections(data);
      });
  }, []);

  // Fetch logs with filters
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);
    if (collectionFilter) params.set('collection', collectionFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    const url = `/api/logs${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, collectionFilter, startDate, endDate]);


  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setActionFilter('');
    setCollectionFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = actionFilter || collectionFilter || startDate || endDate;

  const getActionBadge = (action?: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500/20 text-green-500';
      case 'update':
        return 'bg-blue-500/20 text-blue-500';
      case 'delete':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'create': return 'Создание';
      case 'update': return 'Изменение';
      case 'delete': return 'Удаление';
      default: return action || 'Действие';
    }
  };

  const formatDetails = (log: AuditLog) => {
    if (log.details?.changes) {
      return `Изменены поля: ${log.details.changes}`;
    }
    if (log.details?.after?.name) {
      return log.details.after.name;
    }
    if (log.details?.before?.name) {
      return log.details.before.name;
    }
    // Legacy format support
    if ((log as any).details && typeof (log as any).details === 'string') {
      return (log as any).details;
    }
    return log.collection ? `${log.collection} #${log.recordId}` : '—';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Журнал действий</h1>

      {/* Filters Section */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/5 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-400" />
          <span className="text-white font-medium">Фильтры</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
              Сбросить
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Activity size={14} className="inline mr-1" />
              Тип действия
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-green"
            >
              <option value="">Все действия</option>
              <option value="create">Создание</option>
              <option value="update">Изменение</option>
              <option value="delete">Удаление</option>
            </select>
          </div>

          {/* Collection Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Database size={14} className="inline mr-1" />
              Коллекция
            </label>
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-green"
            >
              <option value="">Все коллекции</option>
              {collections.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Дата от
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-green"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Дата до
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
        </div>
      </div>


      {/* Logs Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Загрузка...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {hasFilters ? 'Нет записей по выбранным фильтрам' : 'Журнал пуст'}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase text-white">
              <tr>
                <th className="p-4">Время</th>
                <th className="p-4">Пользователь</th>
                <th className="p-4">Действие</th>
                <th className="p-4">Коллекция</th>
                <th className="p-4">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(log.timestamp || log.date || log.createdAt || '').toLocaleString('ru-RU')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">
                        <User size={12} />
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getActionBadge(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="p-4">
                    {log.collection ? (
                      <span className="px-2 py-1 rounded text-xs bg-white/10 text-gray-300">
                        {log.collection}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-300 max-w-xs truncate" title={formatDetails(log)}>
                    {formatDetails(log)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results count */}
      {!loading && logs.length > 0 && (
        <div className="mt-4 text-sm text-gray-400">
          Показано записей: {logs.length}
        </div>
      )}
    </div>
  );
}
