import React, { useState } from 'react';
import { 
  Save,
  CheckCircle2
} from 'lucide-react';

interface INSSRegularizationTabProps {
  projectId: string;
  inssRegularization: any | null;
  onRefresh: () => void;
  readOnly?: boolean;
  isStandalone?: boolean;
}

export function INSSRegularizationTab({ projectId, inssRegularization, onRefresh, readOnly, isStandalone }: INSSRegularizationTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      <div className="bg-[#1C232E] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Regularização INSS (SERO)</h2>
            <p className="text-slate-500 text-xs mt-1">Gerencie os dados para cálculo e regularização.</p>
          </div>
          <div className="flex items-center gap-3">
            {showSaveSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in zoom-in-95">
                <CheckCircle2 className="h-3.5 w-3.5" /> Salvo com sucesso
              </span>
            )}
            {!readOnly && (
              <button
                className="px-6 py-2.5 bg-[#BCB5AC] text-[#1C232E] text-[10px] font-bold rounded-lg flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                <Save className="h-4 w-4" /> Salvar Dados
              </button>
            )}
          </div>
        </div>

        <div className="p-8 min-h-[400px] flex items-center justify-center border-b border-white/5">
          <p className="text-slate-500 text-sm italic">Área limpa. Pronto para começar a implementação passo a passo.</p>
        </div>
      </div>
    </div>
  );
}
