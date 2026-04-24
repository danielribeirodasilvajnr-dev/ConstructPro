import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, UserPlus, HardHat } from 'lucide-react';
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
    <div className="flex min-h-screen bg-[#0b0f15] items-center justify-center relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 bg-[#13171f]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50"
      >
        <div className="flex justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] overflow-hidden border border-white/10 shadow-xl bg-[#c1baae]">
            <img src="/logo.png" alt="AevumPro" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            {isLogin ? 'Acesse seus projetos no AevumPro' : 'Junte-se à próxima geração de gestão'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-xs text-red-500 font-semibold">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <p className="text-xs text-emerald-500 font-semibold">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#0b0f15] py-3 pl-12 pr-4 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-primary transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-[#0b0f15] py-3 pl-12 pr-4 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar na plataforma' : 'Cadastrar agora')}
            {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-400">
          {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="ml-2 text-primary hover:text-white transition-colors hover:underline"
          >
            {isLogin ? 'Criar uma agora' : 'Faça login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
