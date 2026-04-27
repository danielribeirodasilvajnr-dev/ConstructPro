// Componentes de célula reutilizáveis - réplica visual fiel da planilha PCI
import React from 'react';
import { cn } from '../../lib/utils';

// --- Célula de cabeçalho de seção (azul escuro) ---
export const SectionHeader = ({ children, colSpan = 12 }: { children: React.ReactNode; colSpan?: number }) => (
  <div className={`col-span-${colSpan} bg-[#2F528F] px-3 py-1.5 border border-[#1a3a6e]`}>
    <span className="text-[10px] font-black text-white uppercase tracking-wider">{children}</span>
  </div>
);

// --- Célula label (cinza claro, não editável) ---
export const LabelCell = ({ children, className = '', cols = 3 }: { children: React.ReactNode; className?: string; cols?: number }) => (
  <div className={cn(
    `col-span-${cols} bg-[#D6DCE4] border border-[#B4B8BF] px-2 py-1 flex items-center`,
    className
  )}>
    <span className="text-[9px] font-bold text-slate-700 leading-tight">{children}</span>
  </div>
);

// --- Célula editável (roxo claro / lilás) ---
export const EditCell = ({ value, onChange, placeholder = '', className = '', cols = 3, type = 'text', maxLength }: {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  cols?: number;
  type?: string;
  maxLength?: number;
}) => (
  <div className={cn(
    `col-span-${cols} bg-[#D9E1F2] border border-[#B4B8BF] px-1 py-0.5`,
    className
  )}>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-transparent text-[10px] font-semibold text-slate-900 outline-none px-1 py-0.5 placeholder:text-slate-400"
    />
  </div>
);

// --- Célula dropdown (borda laranja, editável) ---
export const SelectCell = ({ value, onChange, options, cols = 3, className = '' }: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  cols?: number;
  className?: string;
}) => (
  <div className={cn(
    `col-span-${cols} bg-[#D9E1F2] border-2 border-[#ED7D31] px-1 py-0.5`,
    className
  )}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-[10px] font-semibold text-slate-900 outline-none cursor-pointer appearance-none"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// --- Célula somente leitura / fórmula (fundo branco ou cinza) ---
export const FormulaCell = ({ value, className = '', cols = 3, format = 'text' }: {
  value: string | number;
  className?: string;
  cols?: number;
  format?: 'text' | 'currency' | 'pct' | 'number';
}) => {
  let display = String(value);
  if (format === 'currency') {
    display = Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } else if (format === 'pct') {
    display = `${Number(value).toFixed(2)}%`;
  } else if (format === 'number') {
    display = Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  return (
    <div className={cn(
      `col-span-${cols} bg-white border border-[#B4B8BF] px-2 py-1 flex items-center`,
      className
    )}>
      <span className="text-[10px] font-bold text-slate-800 w-full text-right">{display}</span>
    </div>
  );
};

// --- Célula numérica editável para custos ---
export const CurrencyCell = ({ value, onChange, cols = 3, className = '' }: {
  value: number;
  onChange: (val: number) => void;
  cols?: number;
  className?: string;
}) => (
  <div className={cn(
    `col-span-${cols} bg-[#D9E1F2] border border-[#B4B8BF] px-1 py-0.5`,
    className
  )}>
    <input
      type="number"
      step="0.01"
      min="0"
      value={value || ''}
      onChange={e => onChange(Number(e.target.value) || 0)}
      placeholder="0,00"
      className="w-full bg-transparent text-[10px] font-bold text-slate-900 outline-none text-right px-1 py-0.5 placeholder:text-slate-400"
    />
  </div>
);

// --- Célula de checagem Sim/Falta ---
export const CheckCell = ({ value, onChange, cols = 1, className = '' }: {
  value: string;
  onChange: (val: string) => void;
  cols?: number;
  className?: string;
}) => (
  <div className={cn(
    `col-span-${cols} border border-[#B4B8BF] px-1 py-0.5 flex items-center justify-center cursor-pointer`,
    value === 'Sim' ? 'bg-[#C6EFCE]' : value === 'Falta' ? 'bg-[#FFC7CE]' : 'bg-[#D9E1F2]',
    className
  )} onClick={() => onChange(value === 'Sim' ? 'Falta' : value === 'Falta' ? '' : 'Sim')}>
    <span className={cn(
      "text-[9px] font-black",
      value === 'Sim' ? 'text-green-800' : value === 'Falta' ? 'text-red-800' : 'text-slate-400'
    )}>
      {value || '—'}
    </span>
  </div>
);
