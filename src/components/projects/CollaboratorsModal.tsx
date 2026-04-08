import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Eye, Mail, Loader2, AlertCircle, Verified } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Project, Profile, ProjectCollaborator } from '../../lib/types';
import { cn } from '../../lib/utils';

interface CollaboratorsModalProps {
  project: Project;
  onClose: () => void;
}

export function CollaboratorsModal({ project, onClose }: CollaboratorsModalProps) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('Usuário não encontrado. O colaborador precisa ter uma conta no ConstructPro.');
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
    } catch (err) {
      console.error(err);
      alert('Erro ao remover colaborador');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#181C21] rounded-[24px] shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-800/50">
          <div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">Colaboradores</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{project.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Invite Section */}
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Convidar por E-mail</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder="exemplo@email.com" 
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-[#13171f] border border-slate-800 rounded-xl px-11 py-3 text-sm text-white focus:border-[#4170FF] outline-none transition-all"
                  />
                </div>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="bg-[#13171f] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#4170FF] outline-none appearance-none cursor-pointer"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Leitor/Cliente</option>
                  <option value="proprietor">Proprietário (Cliente)</option>
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
              className="w-full py-3.5 bg-[#4170FF] text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Enviar Convite
            </button>
          </form>

          {/* List Section */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pessoas com acesso</label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Owner */}
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4170FF]/10 flex items-center justify-center text-[#4170FF] font-bold text-sm">
                    {project.client?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-100 block">Administrador</span>
                    <span className="text-[10px] text-slate-500 font-medium">Controle Total</span>
                  </div>
                </div>
                <div className="px-2 py-1 bg-[#4170FF]/20 rounded-md text-[9px] font-black text-[#4170FF] uppercase tracking-wider">Gestor</div>
              </div>

              {/* Collaborators */}
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-600" /></div>
              ) : collaborators.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-600 italic">Nenhum colaborador convidado ainda.</p>
              ) : collaborators.map((c) => (
                <div key={c.id} className="group flex items-center justify-between p-4 bg-[#13171f] rounded-2xl border border-slate-800/50 hover:border-[#4170FF]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm overflow-hidden border border-slate-700">
                      {c.profile?.avatar_url ? (
                        <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (c.profile?.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-100 block truncate max-w-[150px]">{c.profile?.email}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {c.role === 'proprietor' ? (
                          <><Verified className="h-3 w-3 text-[#FF8A00]" /><span className="text-[10px] text-[#FF8A00] font-bold uppercase tracking-wider">Proprietário</span></>
                        ) : c.role === 'editor' ? (
                          <><Shield className="h-3 w-3 text-[#4170FF]" /><span className="text-[10px] text-[#4170FF] font-bold uppercase tracking-wider">Editor</span></>
                        ) : (
                          <><Eye className="h-3 w-3 text-slate-500" /><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Leitor</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeCollaborator(c.id)}
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
