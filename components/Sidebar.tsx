import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  Gavel, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Database,
  CalendarClock,
  DatabaseZap,
  Landmark,
  ChevronDown,
  BookOpen,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  user: User;
  unvalidatedCount: number;
}

type MenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  badge?: boolean;
  children?: Omit<MenuItem, 'children' | 'icon'>[];
};

export const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
{ id: 'tutorial', label: 'Tutorial', icon: <BookOpen size={20} />, path: '/tutorial' },
  { id: 'registries', label: 'Cadastros', icon: <DatabaseZap size={20} />, path: '/registries' },
  { id: 'database', label: 'Banco de Dados', icon: <Database size={20} />, path: '/database' },
  { id: 'transactions', label: 'Lançamentos', icon: <DollarSign size={20} />, path: '/transactions', badge: true },
  { id: 'reconciliation', label: 'Conciliação', icon: <FileText size={20} />, path: '/reconciliation' },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: <Landmark size={20} />,
    children: [
      { id: 'cashflow', label: 'Fluxo de Caixa', path: '/cashflow' },
      { id: 'dre', label: 'DRE Gerencial', path: '/dre' },
      { id: 'financial-entry', label: 'Lançamento Financeiro', path: '/financial-entry' }
    ]
  },
  { id: 'annualAuctions', label: 'Relatório Anual', icon: <CalendarClock size={20} />, path: '/annualAuctions' },
  { id: 'auction-comparison', label: 'Comparativo Leilões', icon: <BarChart3 size={20} />, path: '/auction-comparison' },
  { id: 'auction', label: 'Simulador Leilão', icon: <Gavel size={20} />, path: '/auction' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, user, unvalidatedCount }) => {
  const location = useLocation();
  const currentView = location.pathname.substring(1) || 'dashboard';
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // When the view changes, expand the parent of the active child
    const parent = ALL_MENU_ITEMS.find(item => item.children?.some(child => child.id === currentView));
    if (parent) {
      setExpanded(prev => new Set(prev).add(parent.id));
    }
  }, [currentView]);

  const handleParentClick = (id: string) => {
    setExpanded(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = React.useMemo(() => {
    if (user.role === 'admin') return ALL_MENU_ITEMS;
    
    return ALL_MENU_ITEMS
      .map(item => {
        if (item.children) {
          const permittedChildren = item.children.filter(child => user.permissions?.includes(child.id));
          if (permittedChildren.length > 0) {
            return { ...item, children: permittedChildren };
          }
          return null;
        }
        return user.permissions?.includes(item.id) ? item : null;
      })
      .filter((item): item is MenuItem => item !== null);
  }, [user]);


  return (
    <div 
      className={`h-screen bg-brand-800 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} sticky top-0 left-0 z-50 no-print`}
    >
      <div className="p-4 flex items-center justify-between border-b border-brand-700 h-16">
        {!collapsed && <span className="font-bold text-lg tracking-wider">PARCERIA</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1 hover:bg-brand-700 rounded text-white"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            if (item.children) {
              const isExpanded = expanded.has(item.id);
              const isActive = item.children.some(child => child.id === currentView);

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleParentClick(item.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                        isActive ? 'text-white' : 'text-brand-100 hover:bg-brand-900 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="ml-3 truncate flex-1 text-left font-medium">{item.label}</span>}
                    {!collapsed && <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                  </button>
                  {isExpanded && !collapsed && (
                    <ul className="pl-6 pt-1 space-y-1">
                      {item.children.map(child => (
                        <li key={child.id}>
                          <Link
                            to={child.path!}
                            className={`w-full flex items-center py-2 px-3 rounded-lg transition-colors text-sm ${
                              currentView === child.id 
                                ? 'bg-brand-900 text-white font-medium' 
                                : 'text-brand-200 hover:bg-brand-900 hover:text-white'
                            }`}
                          >
                            <span className="w-5 shrink-0"></span> {/* Indentation */}
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.id}>
                <Link
                  to={item.path!}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    currentView === item.id 
                      ? 'bg-brand-900 text-white font-medium shadow-md' 
                      : 'text-brand-100 hover:bg-brand-900 hover:text-white'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
                  )}
                  {item.badge && unvalidatedCount > 0 && !collapsed && (
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                          {unvalidatedCount}
                      </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-brand-700">
         <button 
            onClick={handleLogout}
            className="w-full flex items-center p-2 text-brand-200 hover:text-white hover:bg-brand-900 rounded"
          >
            <LogOut size={20} />
            {!collapsed && <span className="ml-3">Sair</span>}
         </button>
      </div>
    </div>
  );
};

export default Sidebar;