import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDate, formatDate } from '../utils/format';

const DatePickerInput: React.FC<{
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = useMemo(() => value ? parseDate(value) : null, [value]);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [pickerView, setPickerView] = useState<'days' | 'months' | 'years'>('days');
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

  const handleOpen = () => {
      if (isOpen) {
          setIsOpen(false);
      } else {
          setViewDate(selectedDate || new Date());
          setPickerView('days');
          setIsOpen(true);
      }
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const toYyyyMmDd = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dayOfMonth}`;
    };
    onChange(toYyyyMmDd(newDate));
    setIsOpen(false);
    setPickerView('days');
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setPickerView('days');
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setPickerView('months');
  };
  
  const changeViewDate = (amount: number, unit: 'month' | 'year' | 'decade') => {
      const newDate = new Date(viewDate);
      if (unit === 'month') newDate.setMonth(newDate.getMonth() + amount);
      if (unit === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
      if (unit === 'decade') newDate.setFullYear(newDate.getFullYear() + amount * 10);
      setViewDate(newDate);
  };
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const renderDays = () => (
    <div className="grid grid-cols-7 gap-1 text-center">
      {daysOfWeek.map((day, i) => <div key={i} className="font-medium text-xs text-slate-500 p-1">{day}</div>)}
      {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
        return (
          <button
            key={day}
            onClick={() => handleDayClick(day)}
            className={`p-1 rounded-full aspect-square text-sm transition-colors ${isSelected ? 'bg-brand-800 text-white font-semibold hover:bg-brand-700' : 'hover:bg-slate-100'}`}
          >
            {day}
          </button>
        );
      })}
    </div>
  );

  const renderMonths = () => (
    <div className="grid grid-cols-3 gap-2">
      {monthNames.map((name, index) => (
        <button key={name} onClick={() => handleMonthSelect(index)} className="p-3 text-sm rounded-lg hover:bg-slate-100 text-center font-medium">
          {name.substring(0,3)}
        </button>
      ))}
    </div>
  );

  const renderYears = () => {
    const startOfDecade = Math.floor(year / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => startOfDecade - 1 + i);
    return (
      <div className="grid grid-cols-4 gap-2">
        {years.map(y => (
          <button key={y} onClick={() => handleYearSelect(y)} className={`p-2 text-sm rounded-lg hover:bg-slate-100 font-medium ${y === year ? 'bg-brand-100 text-brand-800' : ''} ${y < startOfDecade || y > startOfDecade + 9 ? 'text-slate-400' : ''}`}>
            {y}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button onClick={handleOpen} className="w-full flex items-center justify-between text-left bg-white border border-slate-200 rounded-lg p-2 text-sm">
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>{value ? formatDate(value) : placeholder}</span>
        <Calendar size={16} className="text-slate-400"/>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-3">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => {
              if (pickerView === 'days') changeViewDate(-1, 'month');
              else if (pickerView === 'months') changeViewDate(-1, 'year');
              else if (pickerView === 'years') changeViewDate(-1, 'decade');
            }} className="p-1.5 rounded-md hover:bg-slate-100"><ChevronLeft size={18} /></button>

            <div className="flex-grow text-center">
                {pickerView === 'days' && (
                    <>
                        <button onClick={() => setPickerView('months')} className="font-semibold text-sm hover:bg-slate-100 rounded px-2 py-1 transition-colors">{monthNames[month]}</button>
                        <button onClick={() => setPickerView('years')} className="font-semibold text-sm hover:bg-slate-100 rounded px-2 py-1 transition-colors">{year}</button>
                    </>
                )}
                {pickerView === 'months' && <button onClick={() => setPickerView('years')} className="font-semibold text-sm hover:bg-slate-100 rounded px-2 py-1 transition-colors">{year}</button>}
                {pickerView === 'years' && <span className="font-semibold text-sm px-2 py-1">{`${Math.floor(year / 10) * 10} - ${Math.floor(year / 10) * 10 + 9}`}</span>}
            </div>

            <button onClick={() => {
              if (pickerView === 'days') changeViewDate(1, 'month');
              else if (pickerView === 'months') changeViewDate(1, 'year');
              else if (pickerView === 'years') changeViewDate(1, 'decade');
            }} className="p-1.5 rounded-md hover:bg-slate-100"><ChevronRight size={18} /></button>
          </div>
          
          {pickerView === 'days' && renderDays()}
          {pickerView === 'months' && renderMonths()}
          {pickerView === 'years' && renderYears()}
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
