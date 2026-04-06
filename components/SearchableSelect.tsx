import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  id: string;
  nome: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => options.find(o => o.id === value) || null, [options, value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter(o => o.nome.toLowerCase().includes(s));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between border border-slate-300 rounded-lg p-2 bg-white text-left text-sm"
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected ? selected.nome : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); handleSelect(null); }}
              className="p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
            >
              Nenhum
            </button>
            {filtered.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${opt.id === value ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-700'}`}
              >
                {opt.nome}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-slate-400">Nenhum resultado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
