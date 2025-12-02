import Link from 'next/link';
import { LayoutDashboard, FileText, Settings, Image as ImageIcon, HelpCircle, DollarSign, Calculator, MessageCircle, FileCheck, Sparkles, UserCheck, Layers, Users } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] flex">
      <aside className="w-64 bg-[#0F172A] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
            <div className="text-2xl font-bold text-white">БМ<span className="text-brand-green">Admin</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar text-sm">
            <Link href="/admin/leads" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><LayoutDashboard size={18}/> CRM Доска</Link>
            <Link href="/admin/ai" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><Sparkles size={18}/> AI Генератор</Link>
            
            <div className="pt-4 pb-2 text-xs font-bold text-gray-600 uppercase px-3">Управление сайтом</div>
            <Link href="/admin/services" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><Layers size={18}/> Услуги (Фон)</Link>
            <Link href="/admin/portfolio" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><ImageIcon size={18}/> Портфолио</Link>
            <Link href="/admin/team" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><Users size={18}/> Команда</Link>
            <Link href="/admin/blog" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><FileText size={18}/> Блог</Link>
            <Link href="/admin/faq" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><HelpCircle size={18}/> FAQ</Link>
            
            <div className="pt-4 pb-2 text-xs font-bold text-gray-600 uppercase px-3">Бизнес</div>
            <Link href="/admin/clients" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><UserCheck size={18}/> Клиенты</Link>
            <Link href="/admin/finance" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><DollarSign size={18}/> Финансы</Link>
            <Link href="/admin/estimates" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><Calculator size={18}/> Сметы</Link>
            <Link href="/admin/documents" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><FileCheck size={18}/> Документы</Link>
            <Link href="/admin/broadcast" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><MessageCircle size={18}/> Рассылка</Link>
            <Link href="/admin/settings" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-colors"><Settings size={18}/> Настройки</Link>
        </nav>
      </aside>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}