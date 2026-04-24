import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Excluir',
  confirmColor = 'bg-red-500' 
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-sm overflow-hidden p-8 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-8 px-2">
              {message}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-3.5 text-[11px] font-black uppercase tracking-[2px] text-slate-400 border border-white/5 rounded-2xl hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }} 
                className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-[2px] text-white rounded-2xl ${confirmColor} hover:brightness-110 shadow-lg transition-all active:scale-95`}
              >
                {confirmText}
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
