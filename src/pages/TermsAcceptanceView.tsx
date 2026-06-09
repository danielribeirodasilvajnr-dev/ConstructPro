import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TermsAcceptanceViewProps {
  onAccept: () => void;
}

export function TermsAcceptanceView({ onAccept }: TermsAcceptanceViewProps) {
  const { user } = useAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('0.0.0.0');

  useEffect(() => {
    // Fetch user IP for legal logging
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('unknown'));
  }, []);

  const handleAccept = async () => {
    if (!acceptedTerms || !acceptedPrivacy || !user) return;
    
    setLoading(true);
    try {
      const { error: termsError } = await supabase.from('terms_acceptances').insert({
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: navigator.userAgent
      });

      if (termsError) throw termsError;

      const { error: profileError } = await supabase.from('profiles').update({
        terms_accepted: true
      }).eq('id', user.id);

      if (profileError) throw profileError;

      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Ocorreu um erro ao registrar o aceite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-surface-container-low/40 backdrop-blur-3xl border border-outline rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-on-surface uppercase tracking-wider mb-2">
            Termos de <span className="text-primary">Uso</span>
          </h2>
          <p className="text-sm text-on-surface-variant font-display tracking-widest uppercase">
            Sua jornada no 360Pro começa aqui
          </p>
        </div>

        <div className="bg-background/50 rounded-2xl border border-outline p-6 h-64 overflow-y-auto mb-8 text-sm text-on-surface-variant space-y-4 custom-scrollbar">
          <h3 className="font-bold text-on-surface uppercase">1. Aceitação dos Termos</h3>
          <p>Ao acessar e utilizar a plataforma 360Pro, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>
          
          <h3 className="font-bold text-on-surface uppercase mt-4">2. Privacidade e Proteção de Dados</h3>
          <p>Sua privacidade é crucial para nós. Todos os dados pessoais (incluindo CPF/CNPJ e informações de clientes) processados na plataforma estão protegidos de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>

          <h3 className="font-bold text-on-surface uppercase mt-4">3. Responsabilidades</h3>
          <p>O usuário é inteiramente responsável pela veracidade dos dados inseridos, especialmente no que tange aos cálculos previdenciários (INSS) e informações de obras.</p>
        </div>

        <div className="space-y-4 mb-10">
          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <div className="w-6 h-6 rounded border-2 border-outline peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-background opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
              Li e aceito integralmente os <strong className="text-primary">Termos de Uso</strong> da plataforma 360Pro.
            </span>
          </label>

          <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <div className="w-6 h-6 rounded border-2 border-outline peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-background opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
              Li e concordo com a <strong className="text-primary">Política de Privacidade</strong> e processamento de dados.
            </span>
          </label>
        </div>

        <div className="text-[10px] text-on-surface-variant/50 text-center mb-6 uppercase tracking-widest font-mono">
          Registro Legal: IP {ipAddress} • {new Date().toLocaleDateString('pt-BR')}
        </div>

        <button
          onClick={handleAccept}
          disabled={!acceptedTerms || !acceptedPrivacy || loading}
          className="w-full flex items-center justify-center gap-3 bg-primary text-background py-5 rounded-2xl font-display font-bold uppercase tracking-[4px] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all shadow-[0_0_40px_-15px_rgba(34,255,136,0.5)] group"
        >
          {loading ? 'REGISTRANDO...' : 'CONTINUAR'}
          {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
        </button>
      </motion.div>
    </div>
  );
}
