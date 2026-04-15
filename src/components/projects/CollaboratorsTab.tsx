import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Eye, Mail, Loader2, AlertCircle, Verified, Phone, Briefcase, Check, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Project, Profile, ProjectCollaborator } from '../../lib/types';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface CollaboratorsTabProps {
  project: Project;
  onRefresh?: () => void;
}

export function CollaboratorsTab({ project, onRefresh }: CollaboratorsTabProps) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer' | 'proprietor'>('editor');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ phone: '', job_title: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('project_id', project.id);

      if (error) throw error;
      setCollaborators(data || []);

      // Fetch owner profile
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', project.user_id)
        .single();
      
      if (ownerData) setOwnerProfile(ownerData);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [project.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setError(null);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado. O colaborador precisa ter uma conta no ConstructPro.');
      }

      if (profile.id === project.user_id) {
        throw new Error('Você já é o proprietário desta obra.');
      }

      const { error: inviteError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: project.id,
          user_id: profile.id,
          role: inviteRole
        });

      if (inviteError) {
        if (inviteError.code === '23505') {
          throw new Error('Este usuário já é um colaborador desta obra.');
        }
        throw inviteError;
      }

      setInviteEmail('');
      await fetchCollaborators();
      onRefresh?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const removeCollaborator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCollaborators(collaborators.filter(c => c.id !== id));
      onRefresh?.();
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro!',
        message: 'Não foi possível remover o colaborador.',
        type: 'error'
      });
    }
  };

  const handleUpdateProfile = async (profileId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: editForm.phone,
          job_title: editForm.job_title
        })
        .eq('id', profileId);

      if (error) throw error;
      
      setEditingId(null);
      await fetchCollaborators();
      
      setAlertConfig({
        isOpen: true,
        title: 'Sucesso',
        message: 'Perfil atualizado com sucesso!',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: 'Erro',
        message: 'Não foi possível atualizar o perfil.',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = (p: Profile) => {
    setEditingId(p.id);
    setEditForm({
      phone: p.phone || '',
      job_title: p.job_title || ''
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#13171f] p-6 rounded-2xl border border-white/5 space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Convidar Equipe</h3>
              <p className="text-xs text-slate-500">Adicione novos colaboradores por e-mail.</p>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-black/20 border border-slate-800 rounded-xl px-11 py-3 text-sm text-white focus:border-[#4170FF] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Permissão</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="w-full bg-black/20 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none appearance-none cursor-pointer"
                >
                  <option value="editor">Editor / Gestor</option>
                  <option value="viewer">Apenas Leitura</option>
                  <option value="proprietor">Proprietário (Cliente)</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="w-full py-3.5 bg-[#4170FF] text-white text-[10px] font-bold rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Enviar Convite
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#13171f] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Nossa Equipe</h3>
            </div>
            
            <div className="divide-y divide-white/5">
              {/* Owner */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#4170FF]/10 flex items-center justify-center text-[#4170FF] font-black text-lg border border-[#4170FF]/20 overflow-hidden">
                      {ownerProfile?.avatar_url ? (
                        <img src={ownerProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (ownerProfile?.email || 'A').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {ownerProfile?.email || 'Administrador'}
                        <span className="px-2 py-0.5 bg-[#4170FF]/10 text-[#4170FF] text-[8px] font-black uppercase tracking-wider rounded">Gestor</span>
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Criador do Projeto</p>
                        {ownerProfile?.job_title && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest border-l border-white/10 pl-2">
                            {ownerProfile.job_title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => ownerProfile && startEditing(ownerProfile)}
                      className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      title="Editar Perfil"
                    >
                      <PenLine className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Contact Info */}
                {!editingId && ownerProfile?.phone && (
                  <div className="flex items-center gap-4 pl-16">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <Phone className="h-3 w-3 text-[#10B981]" />
                      {ownerProfile.phone}
                    </div>
                  </div>
                )}

                {/* Inline Editor for Owner */}
                {editingId === ownerProfile?.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-16 space-y-4 pt-4 border-t border-white/5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Phone className="h-3 w-3" /> Telefone para Contato
                        </label>
                        <input 
                          type="text"
                          placeholder="55119..."
                          value={editForm.phone}
                          onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#4170FF] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Briefcase className="h-3 w-3" /> Cargo / Função
                        </label>
                        <select
                          value={editForm.job_title}
                          onChange={e => setEditForm(prev => ({ ...prev, job_title: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#4170FF] outline-none cursor-pointer"
                        >
                          <option value="">Não definido</option>
                          <option value="Gerente de obras">Gerente de obras</option>
                          <option value="Assistente de engenharia">Assistente de engenharia</option>
                          <option value="Estagiário">Estagiário</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => ownerProfile && handleUpdateProfile(ownerProfile.id)}
                        disabled={isUpdating}
                        className="flex-1 py-2.5 text-[9px] font-black text-white uppercase tracking-widest bg-[#4170FF] rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Salvar Alterações
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Collaborators */}
              {loading ? (
                <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-slate-700 mx-auto" /></div>
              ) : collaborators.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs italic">Ainda não há outros colaboradores nesta obra.</div>
              ) : collaborators.map((c) => (
                <div key={c.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-lg overflow-hidden border border-slate-700 shadow-inner">
                        {c.profile?.avatar_url ? (
                          <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (c.profile?.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{c.profile?.email}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            c.role === 'proprietor' ? 'bg-[#FF8A00]/10 text-[#FF8A00]' :
                            c.role === 'editor' ? 'bg-[#4170FF]/10 text-[#4170FF]' :
                            'bg-slate-800 text-slate-500'
                          )}>
                            {c.role === 'proprietor' ? 'Proprietário' : c.role === 'editor' ? 'Editor' : 'Leitor'}
                          </div>
                          {c.profile?.job_title && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest border-l border-white/10 pl-2">
                              {c.profile.job_title}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => c.profile && startEditing(c.profile)}
                        className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        title="Editar Perfil"
                      >
                        <PenLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeCollaborator(c.id)}
                        className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Contact Info */}
                  {!editingId && c.profile?.phone && (
                    <div className="flex items-center gap-4 pl-16">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <Phone className="h-3 w-3 text-[#10B981]" />
                        {c.profile.phone}
                      </div>
                    </div>
                  )}

                  {/* Inline Editor */}
                  {editingId === c.profile?.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pl-16 space-y-4 pt-4 border-t border-white/5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Phone className="h-3 w-3" /> Telefone para Contato
                          </label>
                          <input 
                            type="text"
                            placeholder="55119..."
                            value={editForm.phone}
                            onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#4170FF] outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="h-3 w-3" /> Cargo / Função
                          </label>
                          <select
                            value={editForm.job_title}
                            onChange={e => setEditForm(prev => ({ ...prev, job_title: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#4170FF] outline-none cursor-pointer"
                          >
                            <option value="">Não definido</option>
                            <option value="Gerente de obras">Gerente de obras</option>
                            <option value="Assistente de engenharia">Assistente de engenharia</option>
                            <option value="Estagiário">Estagiário</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => c.profile && handleUpdateProfile(c.profile.id)}
                          disabled={isUpdating}
                          className="flex-1 py-2.5 text-[9px] font-black text-white uppercase tracking-widest bg-[#4170FF] rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Salvar Alterações
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type as any}
      />
    </div>
  );
}
