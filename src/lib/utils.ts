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

export function sanitizeFileName(fileName: any): string {
  try {
    if (!fileName) return `foto_${Date.now()}.jpg`;
    
    // Convert to string and take only the name part if it's a path
    let name = String(fileName).split(/[\\/]/).pop() || '';
    
    // Very basic sanitization: remove common accented characters manually if needed, 
    // or just let the regex handle it by replacing non-standard chars with underscores.
    return name
      .replace(/[^\w.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  } catch (err) {
    return `foto_${Date.now()}.jpg`;
  }
}

export async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File from the blob to preserve the name and metadata
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Falha na compressão da imagem.'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão.'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
  });
}
