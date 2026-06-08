import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
  secondaryText?: string;
  onSecondary?: () => void;
  secondaryColor?: string;
  cancelText?: string;
  requireText?: string;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Excluir',
  confirmColor = 'bg-red-500',
  secondaryText,
  onSecondary,
  secondaryColor = 'bg-blue-600',
  cancelText = 'Cancelar',
  requireText
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) setInputValue('');
  }, [isOpen]);

  const isConfirmDisabled = requireText ? inputValue !== requireText : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "relative bg-surface rounded-[32px] shadow-2xl border border-outline w-full overflow-hidden p-8 text-center",
              secondaryText ? "max-w-md" : "max-w-sm"
            )}
          >
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6 px-2">
              {message}
            </p>

            {requireText && (
              <div className="mb-6 space-y-2">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Digite <span className="text-on-surface">"{requireText}"</span> para confirmar</p>
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-black/40 border border-outline rounded-xl px-4 py-3 text-sm text-on-surface text-center outline-none focus:border-red-500/50 transition-colors"
                  placeholder={requireText}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-3.5 text-[11px] font-black uppercase tracking-[2px] text-on-surface-variant border border-outline rounded-2xl hover:bg-surface-container-low transition-all order-3 sm:order-1"
              >
                {cancelText}
              </button>
              
              {secondaryText && onSecondary && (
                <button 
                  onClick={() => {
                    onSecondary();
                    onClose();
                  }} 
                  className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-[2px] text-on-surface rounded-2xl ${secondaryColor} hover:brightness-110 shadow-lg transition-all active:scale-95 order-2 sm:order-2`}
                >
                  {secondaryText}
                </button>
              )}

              <button 
                disabled={isConfirmDisabled}
                onClick={() => {
                  onConfirm();
                  onClose();
                }} 
                className={cn(
                  "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[2px] text-on-surface rounded-2xl shadow-lg transition-all active:scale-95 order-1 sm:order-3",
                  confirmColor,
                  isConfirmDisabled ? "opacity-30 cursor-not-allowed grayscale" : "hover:brightness-110"
                )}
              >
                {confirmText}
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
