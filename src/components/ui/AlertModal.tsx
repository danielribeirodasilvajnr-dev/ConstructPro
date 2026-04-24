import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'error' }: AlertModalProps) {
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
            className="relative bg-[#1C232E] rounded-[32px] shadow-2xl border border-white/5 w-full max-w-sm overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                type === 'error' && "bg-red-500/10 text-red-500",
                type === 'success' && "bg-emerald-500/10 text-emerald-500",
                type === 'warning' && "bg-amber-500/10 text-amber-500"
              )}>
                {type === 'error' && <AlertCircle className="h-8 w-8" />}
                {type === 'success' && <CheckCircle2 className="h-8 w-8" />}
                {type === 'warning' && <AlertCircle className="h-8 w-8" />}
              </div>

              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed px-2">
                {message}
              </p>

              <div className="mt-8">
                <button
                  onClick={onClose}
                  className={cn(
                    "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[2px] transition-all active:scale-[0.98] shadow-lg",
                    type === 'error' && "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600",
                    type === 'success' && "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600",
                    type === 'warning' && "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600"
                  )}
                >
                  Entendido
                </button>
              </div>
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
