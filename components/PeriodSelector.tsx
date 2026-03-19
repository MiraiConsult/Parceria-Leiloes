import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Copy } from 'lucide-react';
import { getMonthName } from '../utils/format';

export interface Period {
  year: number;
  months: Set<number>; // 0-11
}

interface PeriodSelectorProps {
  period: { primary: Period; comparative: Period | null };
  onPeriodChange: (period: { primary: Period; comparative: Period | null }) => void;
  availableYears: number[];
}

const allMonths = Array.from({ length: 12 }, (_, i) => i);

const MonthSelector: React.FC<{
  label: string;
  period: Period;
  availableYears: number[];
  onYearChange: (year: number) => void;
  onMonthToggle: (month: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onCopy?: () => void;
  color: 'blue' | 'purple';
}> = ({ label, period, availableYears, onYearChange, onMonthToggle, onSelectAll, onClear, onCopy, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-sky-500',
      hoverBg: 'hover:bg-sky-600',
      text: 'text-sky-600',
    },
    purple: {
      bg: 'bg-purple-500',
      hoverBg: 'hover:bg-purple-600',
      text: 'text-purple-600',
    },
  };
  const c = colorClasses[color];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <label className="font-bold text-xs text-slate-500 uppercase tracking-wider">{label}</label>
        <select value={period.year} onChange={e => onYearChange(parseInt(e.target.value))} className="border border-slate-300 rounded-md px-2 py-1 text-sm font-medium">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {allMonths.map(month => (
          <button
            key={month}
            onClick={() => onMonthToggle(month)}
            className={`px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period.months.has(month) ? `${c.bg} text-white` : `bg-slate-100 hover:bg-slate-200 text-slate-700`
            }`}
          >
            {getMonthName(month)}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center mt-3 text-sm">
        <div className="flex items-center gap-4">
          {onCopy ? (
            <button onClick={onCopy} className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium">
              <Copy size={14} /> Copiar Principal
            </button>
          ) : (
             <button onClick={onSelectAll} className="text-slate-600 hover:text-slate-900 font-medium">
                Selecionar Todos
             </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {onCopy && <button onClick={onSelectAll} className="text-slate-600 hover:text-slate-900 font-medium">Todos</button>}
          <button onClick={onClear} className="text-red-500 hover:text-red-700 font-medium">
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};


const PeriodSelector: React.FC<PeriodSelectorProps> = ({ period, onPeriodChange, availableYears }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftPeriod, setDraftPeriod] = useState(period);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setDraftPeriod(period);
    }
  }, [isOpen, period]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleApply = () => {
    onPeriodChange(draftPeriod);
    setIsOpen(false);
  };
  
  const handleCancel = () => {
    setIsOpen(false);
  };

  // Use draftPeriod for display within the modal
  const primary = draftPeriod.primary;
  const isComparing = draftPeriod.comparative !== null;
  const comparative = draftPeriod.comparative ?? { year: (availableYears[0] || new Date().getFullYear()) - 1, months: new Set(allMonths) };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
      >
        <Calendar size={16} />
        <span className="font-semibold">Configurar Período</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[450px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col">
          <div className="overflow-y-auto">
            <MonthSelector
              label="Período Principal"
              period={primary}
              availableYears={availableYears}
              onYearChange={year => setDraftPeriod(p => ({ ...p, primary: { ...p.primary, year } }))}
              onMonthToggle={month => {
                const newMonths = new Set(primary.months);
                if (newMonths.has(month)) newMonths.delete(month);
                else newMonths.add(month);
                setDraftPeriod(p => ({ ...p, primary: { ...p.primary, months: newMonths } }));
              }}
              onSelectAll={() => setDraftPeriod(p => ({ ...p, primary: { ...p.primary, months: new Set(allMonths) } }))}
              onClear={() => setDraftPeriod(p => ({ ...p, primary: { ...p.primary, months: new Set() } }))}
              color="blue"
            />
            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-3">
              <label htmlFor="compare-toggle" className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="compare-toggle" 
                  className="sr-only peer" 
                  checked={isComparing} 
                  onChange={() => {
                    if (isComparing) {
                      setDraftPeriod(p => ({ ...p, comparative: null }));
                    } else {
                      setDraftPeriod(p => ({ ...p, comparative: { year: p.primary.year - 1, months: new Set(allMonths) } }));
                    }
                  }} 
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
              <span className="text-sm font-medium text-slate-700">Comparar com outro período</span>
            </div>

            {isComparing && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <MonthSelector
                  label="Período Comparativo"
                  period={comparative}
                  availableYears={availableYears}
                  onYearChange={year => setDraftPeriod(p => ({ ...p, comparative: { ...comparative, year } }))}
                  onMonthToggle={month => {
                    const newMonths = new Set(comparative.months);
                    if (newMonths.has(month)) newMonths.delete(month);
                    else newMonths.add(month);
                    setDraftPeriod(p => ({ ...p, comparative: { ...comparative, months: newMonths } }));
                  }}
                  onSelectAll={() => setDraftPeriod(p => ({ ...p, comparative: { ...comparative, months: new Set(allMonths) } }))}
                  onClear={() => setDraftPeriod(p => ({ ...p, comparative: { ...comparative, months: new Set() } }))}
                  onCopy={() => setDraftPeriod(p => ({...p, comparative: {...comparative, year: p.primary.year, months: new Set(p.primary.months)}}))}
                  color="purple"
                />
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 rounded-b-xl">
             <button onClick={handleCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancelar
             </button>
             <button onClick={handleApply} className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900">
                Aplicar
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;