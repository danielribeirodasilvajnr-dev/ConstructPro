import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Lock, ArrowRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onUpgrade: () => void;
}

export function LimitModal({ isOpen, onClose, title, message, onUpgrade }: LimitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface rounded-[32px] shadow-2xl border border-outline w-full max-w-md overflow-hidden"
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary/50 to-primary/10" />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center border border-error/20">
                  <Lock className="w-8 h-8 text-error" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h3 className="text-2xl font-display font-bold text-on-surface uppercase tracking-tight mb-3">
                {title}
              </h3>
              
              <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
                {message}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    onUpgrade();
                  }}
                  className="w-full py-4 px-6 bg-primary text-background font-display font-bold uppercase tracking-[2px] rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_20px_-5px_rgba(34,255,136,0.4)]"
                >
                  Fazer Upgrade
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 px-6 bg-surface-container-low text-on-surface-variant font-display font-bold uppercase tracking-[2px] rounded-2xl hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
