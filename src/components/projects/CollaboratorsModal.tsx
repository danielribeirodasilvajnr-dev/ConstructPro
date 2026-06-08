import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Eye, Mail, Loader2, AlertCircle, Verified, Phone, Briefcase, Check, PenLine } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Project, Profile, ProjectCollaborator } from '../../lib/types';
import { cn } from '../../lib/utils';
import { AlertModal } from '../ui/AlertModal';

interface CollaboratorsModalProps {
  project: Project;
  onClose: () => void;
}

export function CollaboratorsModal({ project, onClose }: CollaboratorsModalProps) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
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
      // 1. Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado. O colaborador precisa ter uma conta no AevumPro.');
      }

      if (profile.id === project.user_id) {
        throw new Error('Você já é o proprietário desta obra.');
      }

      // 2. Add as collaborator
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-low/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-surface rounded-[24px] shadow-2xl border border-outline w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-outline/50">
          <div>
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Colaboradores</h3>
            <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest font-bold">{project.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container-high rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Invite Section */}
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Convidar por E-mail</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-surface border border-outline rounded-xl px-11 py-3 text-sm text-on-surface focus:border-primary outline-none transition-all"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="bg-surface border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none appearance-none cursor-pointer"
                >
                  <option value="editor">Editor</option>
                  <option value="assistant">Assistente de Engenharia</option>
                  <option value="intern">Estagiário</option>
                  <option value="viewer">Apenas Leitura</option>
                  <option value="proprietor">Proprietário/Cliente</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={inviting || !inviteEmail}
              className="w-full py-3.5 bg-primary text-on-primary text-xs font-bold rounded-xl uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Enviar Convite
            </button>
          </form>

          {/* List Section */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Pessoas com acesso</label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Owner */}
              <div className="flex flex-col p-4 bg-surface-container-low rounded-2xl border border-outline/50 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                      {ownerProfile?.avatar_url ? (
                        <img src={ownerProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (ownerProfile?.email || 'A').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-on-surface block truncate max-w-[150px]">{ownerProfile?.email || 'Administrador'}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-on-surface-variant font-medium">Controle Total</span>
                        <div className="px-1.5 py-0.5 bg-primary/20 rounded text-[8px] font-black text-primary uppercase tracking-wider">Gestor</div>
                        {ownerProfile?.job_title && (
                          <span className="text-[9px] bg-surface-container-low px-1.5 py-0.5 rounded text-on-surface-variant font-bold">{ownerProfile.job_title}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => ownerProfile && startEditing(ownerProfile)}
                      className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-all"
                      title="Editar Perfil"
                    >
                      <PenLine className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Contact Info */}
                {!editingId && ownerProfile?.phone && (
                  <div className="flex items-center gap-4 pl-12">
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-medium">
                      <Phone className="h-2.5 w-2.5 text-success" />
                      {ownerProfile.phone}
                    </div>
                  </div>
                )}

                {/* Inline Editor for Owner */}
                {editingId === ownerProfile?.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-outline"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> Telefone
                        </label>
                        <input 
                          type="text"
                          placeholder="Ex: 55119..."
                          value={editForm.phone}
                          onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-black/40 border border-outline rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                          <Briefcase className="h-2.5 w-2.5" /> Cargo
                        </label>
                        <select
                          value={editForm.job_title}
                          onChange={e => setEditForm(prev => ({ ...prev, job_title: e.target.value }))}
                          className="w-full bg-black/40 border border-outline rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                        >
                          <option value="">Nenhum</option>
                          <option value="Gerente de obras">Gerente de obras</option>
                          <option value="Assistente de engenharia">Assistente de engenharia</option>
                          <option value="Estagiário">Estagiário</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 text-[10px] font-bold text-on-surface-variant uppercase bg-surface-container-low rounded-lg hover:bg-surface-container-high"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => ownerProfile && handleUpdateProfile(ownerProfile.id)}
                        disabled={isUpdating}
                        className="flex-1 py-2 text-[10px] font-bold text-on-surface uppercase bg-primary rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Salvar
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Collaborators */}
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-on-surface-variant" /></div>
              ) : collaborators.length === 0 ? (
                <p className="text-center py-4 text-xs text-on-surface-variant italic">Nenhum colaborador convidado ainda.</p>
              ) : collaborators.map((c) => (
                <div key={c.id} className="group flex flex-col p-4 bg-surface rounded-2xl border border-outline/50 hover:border-primary/30 transition-all gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-sm overflow-hidden border border-outline-variant">
                        {c.profile?.avatar_url ? (
                          <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (c.profile?.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-on-surface block truncate max-w-[150px]">{c.profile?.email}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.role === 'proprietor' ? (
                            <><Verified className="h-3 w-3 text-[#FF8A00]" /><span className="text-[10px] text-[#FF8A00] font-bold uppercase tracking-wider">Proprietário/Cliente</span></>
                          ) : c.role === 'editor' ? (
                            <><Shield className="h-3 w-3 text-primary" /><span className="text-[10px] text-primary font-bold uppercase tracking-wider">Editor</span></>
                          ) : c.role === 'assistant' ? (
                            <><Shield className="h-3 w-3 text-emerald-500" /><span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Assistente</span></>
                          ) : c.role === 'intern' ? (
                            <><Shield className="h-3 w-3 text-blue-500" /><span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Estagiário</span></>
                          ) : (
                            <><Eye className="h-3 w-3 text-on-surface-variant" /><span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Apenas Leitura</span></>
                          )}
                          {c.profile?.job_title && (
                            <span className="text-[9px] bg-surface-container-low px-1.5 py-0.5 rounded text-on-surface-variant font-bold ml-1">{c.profile.job_title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => c.profile && startEditing(c.profile)}
                        className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-all"
                        title="Editar Perfil"
                      >
                        <PenLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeCollaborator(c.id)}
                        className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {editingId === c.profile?.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2 border-t border-outline"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" /> Telefone
                          </label>
                          <input 
                            type="text"
                            placeholder="Ex: 55119..."
                            value={editForm.phone}
                            onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-black/40 border border-outline rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                            <Briefcase className="h-2.5 w-2.5" /> Cargo
                          </label>
                          <select
                            value={editForm.job_title}
                            onChange={e => setEditForm(prev => ({ ...prev, job_title: e.target.value }))}
                            className="w-full bg-black/40 border border-outline rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none"
                          >
                            <option value="">Nenhum</option>
                            <option value="Gerente de obras">Gerente de obras</option>
                            <option value="Assistente de engenharia">Assistente de engenharia</option>
                            <option value="Estagiário">Estagiário</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 text-[10px] font-bold text-on-surface-variant uppercase bg-surface-container-low rounded-lg hover:bg-surface-container-high"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => c.profile && handleUpdateProfile(c.profile.id)}
                          disabled={isUpdating}
                          className="flex-1 py-2 text-[10px] font-bold text-on-surface uppercase bg-primary rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Salvar
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
