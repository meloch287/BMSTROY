'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Users, DollarSign, ArrowRight } from 'lucide-react';

interface DashboardData {
  funnel: {
    new: number;
    call: number;
    measure: number;
    contract: number;
  };
  revenue: {
    current: number;
    previous: number;
    change: number;
    income: number;
    expense: number;
  };
  period: {
    start: string;
    end: string;
    type: string;
  };
}

const FUNNEL_LABELS: Record<string, string> = {
  new: 'Новые',
  call: 'Звонок',
  measure: 'Замер',
  contract: 'Договор',
};

const FUNNEL_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  call: 'bg-yellow-500',
  measure: 'bg-purple-500',
  contract: 'bg-green-500',
};

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
];

export default function AdminAnalytics() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<string>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?period=${period}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  // Calculate max value for funnel bar scaling
  const funnelMax = data
    ? Math.max(data.funnel.new, data.funnel.call, data.funnel.measure, data.funnel.contract, 1)
    : 1;

  // Calculate total leads for funnel
  const totalLeads = data
    ? data.funnel.new + data.funnel.call + data.funnel.measure + data.funnel.contract
    : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('ru-RU') + ' ₽';
  };

  // Get change indicator
  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return {
        icon: <TrendingUp size={16} />,
        color: 'text-green-500 bg-green-500/10',
        prefix: '+',
      };
    } else if (change < 0) {
      return {
        icon: <TrendingDown size={16} />,
        color: 'text-red-500 bg-red-500/10',
        prefix: '',
      };
    }
    return {
      icon: <Minus size={16} />,
      color: 'text-gray-400 bg-gray-500/10',
      prefix: '',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Нет данных за выбранный период</div>
      </div>
    );
  }

  const changeIndicator = getChangeIndicator(data.revenue.change);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Аналитика</h1>
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[#0F172A] border border-white/10 p-2 px-4 rounded-xl text-white text-sm"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Revenue */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <DollarSign size={16} />
            <span>Прибыль за период</span>
          </div>
          <div className="flex items-end gap-3">
            <div className={`text-3xl font-bold ${data.revenue.current >= 0 ? 'text-white' : 'text-red-500'}`}>
              {formatCurrency(data.revenue.current)}
            </div>
            {/* Comparison Badge - Requirement 5.3 */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${changeIndicator.color}`}>
              {changeIndicator.icon}
              <span>{changeIndicator.prefix}{data.revenue.change.toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-gray-500 text-xs mt-2">
            vs прошлый период: {formatCurrency(data.revenue.previous)}
          </div>
        </div>

        {/* Income */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
          <div className="text-gray-500 text-sm mb-2">Доходы</div>
          <div className="text-3xl font-bold text-green-500">
            +{formatCurrency(data.revenue.income)}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
          <div className="text-gray-500 text-sm mb-2">Расходы</div>
          <div className="text-3xl font-bold text-red-500">
            -{formatCurrency(data.revenue.expense)}
          </div>
        </div>
      </div>

      {/* Conversion Funnel - Requirement 5.1 */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h2 className="text-xl font-bold text-white">Воронка конверсии</h2>
          </div>
          <div className="text-gray-400 text-sm">
            Всего лидов: <span className="text-white font-bold">{totalLeads}</span>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="space-y-4">
          {(['new', 'call', 'measure', 'contract'] as const).map((stage, index, arr) => {
            const count = data.funnel[stage];
            const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : '0';
            const barWidth = (count / funnelMax) * 100;
            const nextStage = arr[index + 1];
            const nextCount = nextStage ? data.funnel[nextStage] : null;
            const conversionRate = nextCount !== null && count > 0
              ? ((nextCount / count) * 100).toFixed(1)
              : null;

            return (
              <div key={stage}>
                <div className="flex items-center gap-4">
                  {/* Label */}
                  <div className="w-24 text-gray-400 text-sm">{FUNNEL_LABELS[stage]}</div>
                  
                  {/* Bar */}
                  <div className="flex-1 h-10 bg-white/5 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full ${FUNNEL_COLORS[stage]} transition-all duration-500 rounded-lg`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-white font-bold text-sm drop-shadow-lg">
                        {count}
                      </span>
                    </div>
                  </div>

                  {/* Percentage of total */}
                  <div className="w-16 text-right text-gray-400 text-sm">
                    {percentage}%
                  </div>
                </div>

                {/* Conversion arrow between stages */}
                {conversionRate !== null && (
                  <div className="flex items-center gap-4 my-2 ml-24">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ArrowRight size={12} />
                      <span>Конверсия: {conversionRate}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-[#0F172A] p-4 rounded-2xl border border-white/5">
        <div className="text-gray-500 text-sm">
          Период: {new Date(data.period.start).toLocaleDateString('ru-RU')} — {new Date(data.period.end).toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
}
