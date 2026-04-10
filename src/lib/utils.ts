import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '';
  
  // Handle ISO strings (strip time)
  const pureDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = pureDate.split('-');
  
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  // Default format "DD/MM/YYYY" - 100% string based to avoid any timezone/Date object issues
  if (!options || Object.keys(options).length === 0) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }

  // Complex formats (e.g. month: 'long') - use Midday to avoid boundary shifts
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toLocaleDateString('pt-BR', options);
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w.-]/g, '_')        // Replace special characters and spaces with underscores
    .replace(/_{2,}/g, '_');         // Replace multiple underscores with a single one
}

