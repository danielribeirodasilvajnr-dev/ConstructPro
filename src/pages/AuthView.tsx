import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, UserPlus, HardHat, AlertCircle, CheckCircle2, Phone, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

interface AuthViewProps {
  onBack?: () => void;
}

export function AuthView({ onBack }: AuthViewProps) {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
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
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              company_type: companyType,
              company_name: companyName,
              phone: phone,
              cpf_cnpj: cpfCnpj
            }
          }
        });

        if (signUpError) throw signUpError;

        setMessage('Conta criada com sucesso! Redirecionando...');
        
        // Em um app real com confirmação de email habilitada, a sessão não é iniciada imediatamente.
        // Assumindo que a confirmação está desativada no Supabase para esse fluxo simplificado:
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
        className="relative z-10 w-full max-w-lg p-12 bg-surface/60 backdrop-blur-3xl border border-outline rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-8 left-8 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 text-[10px] font-display font-bold uppercase tracking-[2px]"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Voltar
          </button>
        )}

        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-[40px] overflow-hidden border border-outline shadow-2xl bg-surface group-hover:scale-105 transition-transform duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
              <img src={theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"} alt="360Pro" className="w-full h-full object-cover relative z-10 group-hover:rotate-12 transition-transform duration-1000" />
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold tracking-[4px] text-on-surface mb-4 uppercase">
            {isLogin ? (
              <>ACESSO AO <span className="text-primary">SISTEMA</span></>
            ) : (
              <>CRIAR <span className="text-primary">CONTA</span></>
            )}
          </h2>
          <p className="text-xs text-on-surface-variant font-display font-bold uppercase tracking-[3px] opacity-60">
            {isLogin ? 'Identificação Necessária' : 'Junte-se à Revolução 360Pro'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div className="space-y-3">
                <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">Seu Nome Completo</label>
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-wider"
                    placeholder="DIGITE SEU NOME"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">Tipo da Empresa/Profissão</label>
                <div className="relative group">
                  <HardHat className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <select
                    required
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-display tracking-wider appearance-none"
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="Construtora">Construtora</option>
                    <option value="Empresa de Reforma">Empresa de Reforma</option>
                    <option value="Empresa de Engenharia">Empresa de Engenharia</option>
                    <option value="Empreiteiro">Empreiteiro</option>
                    <option value="Escritório de Arquitetura e Interiores">Escritório de Arquitetura e Interiores</option>
                    <option value="Serviços Especializados">Serviços Especializados</option>
                    <option value="Designer de Interiores">Designer de Interiores</option>
                    <option value="Fabricante">Fabricante</option>
                    <option value="Loja">Loja</option>
                    <option value="Móveis Planejados">Móveis Planejados</option>
                    <option value="Estudante de Engenharia">Estudante de Engenharia</option>
                    <option value="Estudante de Arquitetura ou Design de Interiores">Estudante de Arquitetura ou Design de Interiores</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">Nome da Empresa</label>
                <div className="relative group">
                  <Building className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-wider"
                    placeholder="NOME DA SUA EMPRESA"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">Celular (WhatsApp)</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length > 11) v = v.substring(0, 11);
                      if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
                      if (v.length > 10) v = `${v.substring(0, 10)}-${v.substring(10)}`;
                      setPhone(v);
                    }}
                    className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-wider"
                    placeholder="(99) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">CPF ou CNPJ</label>
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    required
                    value={cpfCnpj}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length <= 11) {
                        v = v.replace(/(\d{3})(\d)/, '$1.$2');
                        v = v.replace(/(\d{3})(\d)/, '$1.$2');
                        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                      } else {
                        v = v.substring(0, 14);
                        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                        v = v.replace(/(\d{4})(\d)/, '$1-$2');
                      }
                      setCpfCnpj(v);
                    }}
                    className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-wider"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">E-mail Corporativo</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-wider"
                placeholder="NOME@EMPRESA.COM"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-display font-bold text-on-surface uppercase tracking-[4px] ml-1">Chave de Segurança (Senha)</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-outline bg-background/50 py-4.5 pl-14 pr-6 text-sm text-on-surface focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/30 font-display tracking-widest"
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
            {loading ? (isLogin ? 'AUTENTICANDO...' : 'CRIANDO CONTA...') : (isLogin ? 'INICIAR SESSÃO' : 'CRIAR CONTA')}
            {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">
            Novos cadastros estão temporariamente suspensos
          </p>
        </div>
      </motion.div>
    </div>
  );
}
