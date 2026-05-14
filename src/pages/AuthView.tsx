import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, UserPlus, HardHat, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Cadastro efetuado! Autenticando... (ou verifique seu e-mail se necessário)');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center relative overflow-hidden">
      {/* High-Tech Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg p-12 bg-surface/60 backdrop-blur-3xl border border-white/5 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-surface group-hover:scale-105 transition-transform duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
              <img src="/logo.png" alt="360Pro" className="w-full h-full object-cover relative z-10 group-hover:rotate-12 transition-transform duration-1000 [filter:invert(1)_hue-rotate(180deg)]" />
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold tracking-[4px] text-white mb-4 uppercase">
            {isLogin ? 'ACESSO AO' : 'REGISTRO'} <span className="text-primary">SISTEMA</span>
          </h2>
          <p className="text-xs text-on-surface-variant font-display font-bold uppercase tracking-[3px] opacity-60">
            {isLogin ? 'Identificação Necessária' : 'Configuração de Novo Gestor'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 rounded-2xl bg-error/5 border border-error/20 p-5 flex items-center gap-4"
          >
            <AlertCircle className="h-5 w-5 text-error shrink-0" />
            <p className="text-[11px] text-error font-display font-bold uppercase tracking-wider">{error}</p>
          </motion.div>
        )}

        {message && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 rounded-2xl bg-primary/5 border border-primary/20 p-5 flex items-center gap-4"
          >
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <p className="text-[11px] text-primary font-display font-bold uppercase tracking-wider">{message}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-display font-bold text-white uppercase tracking-[4px] ml-1">E-mail Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-background/50 py-4.5 pl-14 pr-6 text-sm text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-wider"
                placeholder="NOME@EMPRESA.COM"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-display font-bold text-white uppercase tracking-[4px] ml-1">Chave de Segurança</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-background/50 py-4.5 pl-14 pr-6 text-sm text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-12 flex w-full items-center justify-center gap-4 rounded-2xl bg-primary py-5 text-xs font-display font-bold text-background transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_rgba(34,255,136,0.6)] uppercase tracking-[4px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {loading ? 'AUTENTICANDO...' : 'INICIAR SESSÃO'}
            {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-display font-bold text-on-surface-variant hover:text-primary uppercase tracking-[3px] transition-colors"
          >
            {isLogin ? 'Solicitar Acesso ao Sistema' : 'Já possui credenciais? Entrar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
