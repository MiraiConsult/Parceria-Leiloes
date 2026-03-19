import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  id: string;
  nome: string;
}

interface MultiSelectFilterProps {
  options: Option[];
  selectedIds: Set<string>;
  onSelectionChange: (newSelectedIds: Set<string>) => void;
  label: string;
  className?: string;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ options, selectedIds, onSelectionChange, label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      option.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const handleSelectAll = () => {
    onSelectionChange(new Set(filteredOptions.map(o => o.id)));
  };

  const handleClear = () => {
    onSelectionChange(new Set());
  };
  
  const getButtonLabel = () => {
    const plural = label === 'Leilão' ? 'Leilões' : `${label}s`;

    if (selectedIds.size === 0 || selectedIds.size === options.length) {
      return `Todos os ${plural}`;
    }
    if (selectedIds.size === 1) {
        const selectedOption = options.find(o => selectedIds.has(o.id));
        return selectedOption ? selectedOption.nome : `1 ${label} selecionado`;
    }
    return `${selectedIds.size} ${plural} selecionados`;
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
      >
        <span className="font-medium truncate">{getButtonLabel()}</span>
        <ChevronDown size={16} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-slate-100">
             <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder={`Buscar ${label}...`}
                    className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <ul className="max-h-60 overflow-y-auto p-2">
            {filteredOptions.map(option => (
              <li key={option.id}>
                <label className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(option.id)}
                    onChange={() => handleToggle(option.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-800">{option.nome}</span>
                </label>
              </li>
            ))}
            {filteredOptions.length === 0 && (
                <li className="p-2 text-center text-sm text-slate-500">Nenhum resultado.</li>
            )}
          </ul>
           <div className="p-2 border-t border-slate-100 flex justify-between">
                <button onClick={handleSelectAll} className="text-sm font-medium text-brand-700 hover:underline">Selecionar Visíveis</button>
                <button onClick={handleClear} className="text-sm font-medium text-red-600 hover:underline">Limpar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;