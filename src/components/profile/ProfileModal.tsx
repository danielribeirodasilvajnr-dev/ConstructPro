import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Camera, 
  Loader2, 
  Check, 
  AlertCircle,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/types';
import { cn } from '../../lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ProfileModal({ isOpen, onClose, onUpdate }: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    job_title: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        job_title: data.job_title || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          job_title: form.job_title,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      if (onUpdate) onUpdate();
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await fetchProfile();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Erro ao enviar foto');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 overflow-y-auto pt-[5vh] md:pt-[10vh]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#1C232E] rounded-3xl border border-white/5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#BCB5AC]/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#BCB5AC]/10 rounded-2xl">
                  <User className="h-6 w-6 text-[#BCB5AC]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Detalhes do Perfil</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gerencie suas informações</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 text-[#BCB5AC] animate-spin" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Carregando perfil...</p>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-8">
                  {/* Photo Section */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-[#1C232E] overflow-hidden shadow-2xl relative">
                        {isUploading ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                        ) : (
                          <div 
                            onClick={() => document.getElementById('profile-avatar-input')?.click()}
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
                          >
                            <Camera className="h-8 w-8 text-white mb-2" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Alterar</span>
                          </div>
                        )}
                        <img 
                          src={profile?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDr2KBEM3IfNuLeYQzBV2epZtmQRHo705P26eLsIJNDiEclnujrH-W8yGNhysNXXqjOiVzILkQhCDIwxjR0PGIerPvj8eqJTY7Oc8UEQKKnhaSsupnlPqauvvqKk3HoJNEcvL1Kyc0iwjG1Z-tQN2YkiFoDh5SO8ALfjcgKp8FuaK6v3Tsp4RQcn2s7yE3k14OYP1RI8jfXjJ8uHoczokjDD4vwOK4TciQdENZTm185x4zIDC_1ElKSlJ8kQxS_R-2KzY0iRSGLhg"} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input 
                        type="file" 
                        id="profile-avatar-input" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white mb-1">{profile?.email}</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="px-2 py-0.5 bg-[#BCB5AC]/10 text-[#BCB5AC] text-[8px] font-black uppercase tracking-wider rounded border border-[#BCB5AC]/20 flex items-center gap-1">
                          <Shield className="h-2 w-2" /> Administrador
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <User className="h-3 w-3" /> Nome Completo
                      </label>
                      <input 
                        type="text"
                        value={form.full_name}
                        onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Seu nome completo"
                        className="w-full bg-[#1C232E] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Phone className="h-3 w-3" /> Telefone
                        </label>
                        <input 
                          type="text"
                          value={form.phone}
                          onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Ex: 55119..."
                          className="w-full bg-[#1C232E] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Briefcase className="h-3 w-3" /> Cargo / Função
                        </label>
                        <select
                          value={form.job_title}
                          onChange={e => setForm(prev => ({ ...prev, job_title: e.target.value }))}
                          className="w-full bg-[#1C232E] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-all shadow-inner cursor-pointer"
                        >
                          <option value="">Não definido</option>
                          <option value="Gerente de obras">Gerente de obras</option>
                          <option value="Assistente de engenharia">Assistente de engenharia</option>
                          <option value="Estagiário">Estagiário</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 opacity-50">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Mail className="h-3 w-3" /> E-mail (Identificador)
                      </label>
                      <input 
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider",
                        message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}
                    >
                      {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {message.text}
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button 
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 text-xs font-black text-slate-500 uppercase tracking-[2px] hover:bg-white/5 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isUpdating}
                      className="flex-[2] py-4 bg-[#BCB5AC] text-white text-xs font-black uppercase tracking-[2px] rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/30 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
