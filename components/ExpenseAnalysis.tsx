import React, { useState } from 'react';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Treemap } from 'recharts';
import { TrendingUp, TrendingDown, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

const ExpenseKpiCard: React.FC<{ title: string; value: string; variation?: number; variationLabel?: string }> = ({ title, value, variation, variationLabel }) => {
    const hasVariation = variation !== undefined && !isNaN(variation);
    const isNegativeChangeGood = true; // For expenses, a decrease is good
    const isPositive = hasVariation && variation >= 0;
  
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-1">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {hasVariation && (
            <div className={`flex items-center text-sm font-semibold ${isPositive === isNegativeChangeGood ? 'text-red-600' : 'text-green-600'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(variation).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {hasVariation && <p className="text-xs text-slate-400 mt-1">{variationLabel}</p>}
      </div>
    );
};

const CustomizedTreemapContent = (props: { depth?: number; x?: number; y?: number; width?: number; height?: number; index?: number; name?: string; value?: number; [key: string]: unknown }) => {
    const { depth, x, y, width, height, index = 0, name, value } = props;
    const colors = ['#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5'];
    const color = colors[index % colors.length];
  
    const formattedValue = formatCurrency(value);

    const getTextColor = (bgColor: string) => {
        if (!bgColor) return '#ffffff';
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6 ? '#1e293b' : '#ffffff';
    };

    const textColor = getTextColor(color);
    
    if (width < 30 || height < 20) {
        return <g><rect x={x} y={y} width={width} height={height} style={{ fill: color, stroke: 'white', strokeWidth: 1 }} /></g>;
    }
    
    let fontSize = 14;
    if (width < 100 || height < 50) {
        fontSize = 11;
    }
    
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} style={{ fill: color, stroke: '#fff', strokeWidth: 2 / (depth + 1e-10), strokeOpacity: 1 / (depth + 1e-10) }} />
        <foreignObject x={x + 5} y={y + 5} width={width - 10} height={height - 10}>
          <div style={{ width: `${width - 10}px`, height: `${height - 10}px`, color: textColor, fontSize: `${fontSize}px`, lineHeight: '1.2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{name}</div>
            {height > 40 && <div style={{ fontSize: `${Math.max(fontSize - 2, 10)}px`, opacity: 0.9, alignSelf: 'flex-end', marginTop: '4px' }}>{formattedValue}</div>}
          </div>
        </foreignObject>
      </g>
    );
};


interface ExpenseAnalysisProps {
  expenses: {
    totalCurrent: number;
    variation: number;
    monthlyAverage: number;
    topCategory: string;
    monthlyTrend: { name: string; Despesa: number }[];
    treemapData: { name: string; size: number }[];
    currentTreemapTitle: string;
    tableData: Record<string, { total: number, centros: Record<string, { total: number, rubricas: Record<string, { name: string, total: number }> }> }>;
  };
  variationLabel: string;
  treemapDrilldownPath: string[];
  setTreemapDrilldownPath: React.Dispatch<React.SetStateAction<string[]>>;
  handleTreemapClick: (data: { name?: string } | undefined) => void;
}

const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({ expenses, variationLabel, treemapDrilldownPath, setTreemapDrilldownPath, handleTreemapClick }) => {
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

  const handleToggleRow = (key: string) => {
    setCollapsedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        return newSet;
    });
  };

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExpenseKpiCard title="Total de Despesas" value={formatCurrency(expenses.totalCurrent)} variation={expenses.variation} variationLabel={variationLabel} />
            <ExpenseKpiCard title="Média Mensal" value={formatCurrency(expenses.monthlyAverage)} />
            <ExpenseKpiCard title="Principal Categoria" value={expenses.topCategory} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Evolução Mensal das Despesas</h3><ResponsiveContainer width="100%" height={300}><BarChart data={expenses.monthlyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis tickFormatter={val => `${(val/1000).toFixed(0)}k`}/><Tooltip formatter={(val:number) => formatCurrency(val)}/><Bar dataKey="Despesa" fill="#b91c1c" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{expenses.currentTreemapTitle}</h3>
                    {treemapDrilldownPath.length > 0 && (
                        <button onClick={() => setTreemapDrilldownPath([])} className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-800">
                            <ArrowLeft size={16} /> Voltar
                        </button>
                    )}
                </div>
                <ResponsiveContainer width="100%" height={300}><Treemap isAnimationActive={false} data={expenses.treemapData} dataKey="size" ratio={4/3} stroke="#fff" fill="#8884d8" content={<CustomizedTreemapContent/>} onClick={handleTreemapClick}/></ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold p-6 border-b border-slate-100">Despesas Detalhadas por Categoria</h3>
            <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500 font-medium"><th className="p-4 w-3/5">Categoria</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">% do Total</th></tr></thead>
                <tbody>
                {Object.entries(expenses.tableData || {}).map(([classificacao, classData]) => {
                    const typedClassData = classData;
                    if (!typedClassData || typeof typedClassData.total !== 'number' || !typedClassData.centros) return null;
                    return (
                    <React.Fragment key={classificacao}>
                        <tr className="bg-slate-100 font-bold cursor-pointer" onClick={() => handleToggleRow(classificacao)}>
                            <td className="p-3 flex items-center gap-2">{collapsedRows.has(classificacao) ? <ChevronRight size={16}/> : <ChevronDown size={16}/>} {classificacao.replace(/_/g, ' ')}</td>
                            <td className="p-3 text-right">{formatCurrency(typedClassData.total)}</td>
                            <td className="p-3 text-right">{expenses.totalCurrent > 0 ? ((Number(typedClassData.total)/expenses.totalCurrent)*100).toFixed(1) : '0.0'}%</td>
                        </tr>
                        {!collapsedRows.has(classificacao) && Object.entries(typedClassData.centros || {}).map(([centro, centroData]) => {
                            const typedCentroData = centroData;
                            if (!typedCentroData || typeof typedCentroData.total !== 'number' || !typedCentroData.rubricas) return null;
                            return (
                            <React.Fragment key={centro}>
                                <tr className="bg-slate-50 font-semibold cursor-pointer" onClick={() => handleToggleRow(`${classificacao}-${centro}`)}>
                                    <td className="p-2 pl-10 flex items-center gap-2">{collapsedRows.has(`${classificacao}-${centro}`) ? <ChevronRight size={14}/> : <ChevronDown size={14}/>} {centro}</td>
                                    <td className="p-2 text-right">{formatCurrency(typedCentroData.total)}</td>
                                    <td className="p-2 text-right">{expenses.totalCurrent > 0 ? ((Number(typedCentroData.total)/expenses.totalCurrent)*100).toFixed(1) : '0.0'}%</td>
                                </tr>
                                {!collapsedRows.has(`${classificacao}-${centro}`) && Object.entries(typedCentroData.rubricas || {}).map(([rubricaId, rubricaData]) => {
                                    const typedRubricaData = rubricaData;
                                    if (!typedRubricaData || typeof typedRubricaData.total !== 'number' || !typedRubricaData.name) return null;
                                    return (
                                    <tr key={rubricaId} className="hover:bg-sky-50/50">
                                        <td className="py-2 px-3 pl-16 text-slate-600">{typedRubricaData.name}</td>
                                        <td className="py-2 px-3 text-right">{formatCurrency(typedRubricaData.total)}</td>
                                        <td className="py-2 px-3 text-right">{expenses.totalCurrent > 0 ? ((Number(typedRubricaData.total)/expenses.totalCurrent)*100).toFixed(1) : '0.0'}%</td>
                                    </tr>
                                )})}
                            </React.Fragment>
                        )})}
                    </React.Fragment>
                )})}
                </tbody>
            </table></div>
        </div>
    </div>
  );
};

export default ExpenseAnalysis;
