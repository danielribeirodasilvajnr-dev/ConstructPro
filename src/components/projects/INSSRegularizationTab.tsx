import React, { useState, useRef, useEffect } from 'react';
import {
  Calculator as CalculatorIcon,
  ArrowLeft,
  TrendingDown,
  Clock,
  ShieldCheck,
  Save,
  Printer,
  CheckCircle2,
  Key,
  Lock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { cn, formatCurrency, sanitizeFileName } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { INSSRegularization } from '../../lib/types';
import forge from 'node-forge';

interface INSSRegularizationTabProps {
  projectId: string;
  inssRegularization: INSSRegularization | null;
  onRefresh: () => void;
  readOnly?: boolean;
  isStandalone?: boolean;
}

export function INSSRegularizationTab({ projectId, inssRegularization, onRefresh, readOnly, isStandalone }: INSSRegularizationTabProps) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('');
  const [responsavel, setResponsavel] = useState('pessoa física');
  const [destinacao, setDestinacao] = useState('Residencial unifamiliar');
  const [tipoObra, setTipoObra] = useState('Alvenaria');
  const [concreto, setConcreto] = useState('Sim');
  const [uf, setUf] = useState('SP');

  // Áreas
  const [areaCon, setAreaCon] = useState(0);
  const [areaRef, setAreaRef] = useState(0);
  const [areaDem, setAreaDem] = useState(0);
  const [areaPisc, setAreaPisc] = useState(0);

  const [showResults, setShowResults] = useState(false);
  const [showFatorAjuste, setShowFatorAjuste] = useState(false);

  // Fator de Ajuste Inputs
  const [fatorInicioMes, setFatorInicioMes] = useState('');
  const [fatorInicioAno, setFatorInicioAno] = useState('');
  const [fatorFimMes, setFatorFimMes] = useState('');
  const [fatorFimAno, setFatorFimAno] = useState('');

  // Certificado Digital
  const [certPassword, setCertPassword] = useState('');
  const [certInfo, setCertInfo] = useState<any>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [isProcessingCert, setIsProcessingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Initialize from props
  useEffect(() => {
    if (inssRegularization) {
      setName(inssRegularization.name || '');
      setClient(inssRegularization.client || '');
      setPhone(inssRegularization.phone || '');
      setResponsavel(inssRegularization.responsavel);
      setDestinacao(inssRegularization.destinacao);
      setTipoObra(inssRegularization.tipo_obra);
      setConcreto(inssRegularization.concreto_usinado);
      setUf(inssRegularization.uf);
      setAreaCon(inssRegularization.area_construcao);
      setAreaRef(inssRegularization.area_reforma);
      setAreaDem(inssRegularization.area_demolicao);
      setAreaPisc(inssRegularization.area_piscina);
      setFatorInicioMes(inssRegularization.fator_inicio_mes || '');
      setFatorInicioAno(inssRegularization.fator_inicio_ano || '');
      setFatorFimMes(inssRegularization.fator_fim_mes || '');
      setFatorFimAno(inssRegularization.fator_fim_ano || '');
      setCertUrl(inssRegularization.certificate_url || null);
      setCertPassword(inssRegularization.certificate_password || '');
      setCertInfo(inssRegularization.certificate_info || null);
    }
  }, [inssRegularization]);

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !certPassword) {
      if (!certPassword) setCertError('Informe a senha do certificado antes de anexar.');
      return;
    }

    setIsProcessingCert(true);
    setCertError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const binary = event.target?.result as string;
          
          // Process with node-forge
          const p12Asn1 = forge.asn1.fromDer(binary);
          const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);

          // Extract info
          const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
          if (!certBags || certBags.length === 0) throw new Error('Certificado não encontrado no arquivo PFX.');
          
          const cert = certBags[0].cert;
          
          // Helper to format subject attributes
          const formatAttrs = (attrs: any) => attrs.map((a: any) => `${a.shortName || a.name}=${a.value}`).join(', ');
          
          const info = {
            subject: formatAttrs(cert.subject.attributes),
            issuer: formatAttrs(cert.issuer.attributes),
            valid_from: cert.validity.notBefore.toISOString(),
            valid_to: cert.validity.notAfter.toISOString()
          };

          // Upload to Storage
          const fileName = `certificates/${projectId}/${Date.now()}_${sanitizeFileName(file.name)}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-documents')
            .getPublicUrl(fileName);

          setCertUrl(publicUrl);
          setCertInfo(info);
          setIsProcessingCert(false);
        } catch (err: any) {
          console.error(err);
          setCertError('Erro ao processar certificado. Verifique a senha.');
          setIsProcessingCert(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      setCertError('Erro ao ler o arquivo.');
      setIsProcessingCert(false);
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
    setIsSaving(true);
    try {
      const data: Partial<INSSRegularization> = {
        id: isStandalone ? projectId : undefined,
        project_id: isStandalone ? undefined : projectId,
        name,
        client,
        phone,
        responsavel,
        destinacao,
        tipo_obra: tipoObra,
        concreto_usinado: concreto,
        uf,
        area_construcao: areaCon,
        area_reforma: areaRef,
        area_demolicao: areaDem,
        area_piscina: areaPisc,
        fator_inicio_mes: fatorInicioMes,
        fator_inicio_ano: fatorInicioAno,
        fator_fim_mes: fatorFimMes,
        fator_fim_ano: fatorFimAno,
        certificate_url: certUrl || undefined,
        certificate_password: certPassword || undefined,
        certificate_info: certInfo || undefined,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('inss_regularizations')
        .upsert(data, { onConflict: isStandalone ? 'id' : 'project_id' });

      if (error) throw error;
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Error saving INSS regularization:', err);
      alert('Erro ao salvar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const isPeriodoCompleto = fatorInicioMes !== '' && fatorInicioAno !== '' && fatorFimMes !== '' && fatorFimAno !== '';
  const totalArea = areaCon + areaRef + areaDem + areaPisc;

  // =====================================================
  // SERO Calculation Engine
  // =====================================================
  const getVAU = () => {
    if (tipoObra === 'Alvenaria') return 2623.53;
    if (tipoObra === 'Madeira') return 1622.73;
    return 2229.00; // Mista
  };

  const getFatorDestinacao = () => {
    if (destinacao === 'Residencial unifamiliar') return 0.89;
    if (destinacao === 'Residencial multifamiliar') return 0.80;
    return 1.0; // Comercial
  };

  const getPercUsoUF = () => {
    const t: Record<string, number> = {
      'SP': 4.90, 'RJ': 5.10, 'MG': 4.70, 'SC': 4.80, 'PR': 4.85,
      'RS': 4.75, 'BA': 4.60, 'PE': 4.55, 'CE': 4.50, 'DF': 5.05,
      'GO': 4.65, 'ES': 4.70, 'MT': 4.60, 'MS': 4.65, 'PA': 4.50
    };
    return t[uf] || 4.90;
  };

  const getBaseMaoObra = () => {
    if (tipoObra === 'Alvenaria') return 8.00;
    if (tipoObra === 'Madeira') return 6.50;
    return 7.25; // Mista
  };

  const vau = getVAU();
  const fatorDest = getFatorDestinacao();
  const percUsoUF = getPercUsoUF();
  const percAjuste = concreto === 'Sim' ? 5.00 : 0;
  const baseMaoObra = getBaseMaoObra();

  const calcCOD = Number((totalArea * vau * fatorDest).toFixed(2));
  const abatimentoPerc = (percUsoUF * percAjuste) / 100;
  const percMaoObraEfetivo = baseMaoObra - abatimentoPerc;
  const calcRMT = Number((calcCOD * (percMaoObraEfetivo / 100)).toFixed(2));
  const aliquotaINSS = responsavel === 'pessoa física' ? 0.3680 : 0.3180;
  const inssInicial = Number((calcRMT * aliquotaINSS).toFixed(2));

  const results = React.useMemo(() => {
    if (!isPeriodoCompleto) return null;
    let iMes = parseInt(fatorInicioMes);
    let iAno = parseInt(fatorInicioAno);
    let fMes = parseInt(fatorFimMes);
    let fAno = parseInt(fatorFimAno);

    let dMes = iMes + 1;
    let dAno = iAno;
    if (dMes > 12) { dMes = 1; dAno++; }

    let totalMeses = (fAno - dAno) * 12 + (fMes - dMes) + 1;
    if (totalMeses < 1) totalMeses = 1;

    const percMin = totalArea > 350 ? 70 : 50;
    const multiplicadorSimulacao = 1.02058;
    const totalRemunRaw = Number((calcRMT * (percMin / 100)).toFixed(2));
    const totalRemun = Number((totalRemunRaw * multiplicadorSimulacao).toFixed(2));
    
    const remMes = Number((totalRemun / totalMeses).toFixed(2));
    const alíquotaSimulada = 0.20;
    const inssMes = Number((remMes * alíquotaSimulada).toFixed(2));

    const selicMap: Record<number, number> = {
      2: 1.00, 3: 2.21, 4: 3.21, 5: 4.37, 6: 5.59,
      7: 6.64, 8: 7.92, 9: 9.14, 10: 10.30, 11: 11.58,
      12: 12.68, 13: 13.82, 14: 14.88
    };

    let rows: any[] = [];
    let totalRem = 0, totalInss = 0, totalMulta = 0, totalJuros = 0, totalMaed = 0;
    let cMes = dMes, cAno = dAno;
    let lateInss = 0, lateMulta = 0, lateJuros = 0, lateMaed = 0;
    let futureInss = 0;

    for (let i = 0; i < totalMeses; i++) {
      const hoje = new Date();
      const age = (hoje.getFullYear() - cAno) * 12 + (hoje.getMonth() + 1 - cMes);
      
      let multaPerc = age >= 4 ? 0.20 : age === 3 ? 0.16 : age === 2 ? 0.06 : 0;
      let jurosPerc = selicMap[age] || (age > 14 ? 14.88 + (age - 14) * 1.10 : 0);
      
      const isLate = age >= 2;
      const multaVal = isLate ? inssMes * multaPerc : 0;
      const jurosVal = isLate ? inssMes * (jurosPerc / 100) : 0;
      const maedVal = isLate ? 100.00 : 0;

      rows.push({
        mesStr: `${cMes.toString().padStart(2, '0')}/${cAno}`,
        rem: remMes, inss: inssMes, multa: multaVal,
        juros: jurosVal, maed: maedVal, jurosPerc, isAtraso: isLate
      });

      totalRem += remMes;
      totalInss += inssMes;
      totalMulta += multaVal;
      totalJuros += jurosVal;
      totalMaed += maedVal;

      if (isLate) {
        lateInss += inssMes;
        lateMulta += multaVal;
        lateJuros += jurosVal;
        lateMaed += maedVal;
      } else {
        futureInss += inssMes;
      }

      cMes++; if (cMes > 12) { cMes = 1; cAno++; }
    }

    const inssEmAtrasoTotal = lateInss + lateMulta + lateJuros + lateMaed;
    const inssFinal = inssEmAtrasoTotal + futureInss;
    const reducao = inssInicial - inssFinal;
    const percReducao = inssInicial > 0 ? ((reducao / inssInicial) * 100).toFixed(0) : '0';
    const remCorrigida = Number((totalRem * 1.01079).toFixed(2));

    return {
      dMes, dAno, fMes, fAno, totalMeses, remMes, inssMes,
      totalRem, totalInss, totalMulta, totalJuros, totalMaed,
      inssEmAtrasoTotal, inssFinal, reducao, percReducao, rows,
      remCorrigida, lateInss, futureInss, 
      lateMonths: inssMes > 0 ? Math.floor(lateInss / inssMes) : 0, 
      futureMonths: inssMes > 0 ? Math.floor(futureInss / inssMes) : 0
    };
  }, [fatorInicioMes, fatorInicioAno, fatorFimMes, fatorFimAno, totalArea, calcRMT, inssInicial, aliquotaINSS]);

  const summaryRef = useRef<HTMLDivElement>(null);

  const handlePrint = (elementRef: React.RefObject<HTMLDivElement | null>) => {
    const content = elementRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Regularização INSS - AevumPro</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div id="printable-area">${content.innerHTML}</div>
          <script>setTimeout(() => { window.print(); window.close(); }, 800);</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      <div className="bg-[#1C232E] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Regularização INSS (SERO)</h2>
            <p className="text-slate-500 text-xs mt-1">Configure os parâmetros da obra para calcular os impostos devidos.</p>
          </div>
          <div className="flex items-center gap-3">
            {showSaveSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in zoom-in-95">
                <CheckCircle2 className="h-3.5 w-3.5" /> Salvo com sucesso
              </span>
            )}
            {!readOnly && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#BCB5AC] text-[#1C232E] text-[10px] font-bold rounded-lg flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                <Save className="h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Dados'}
              </button>
            )}
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[2px] mb-2">Identificação</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Nome da Obra</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Cliente</label>
                <input 
                  type="text" 
                  value={client} 
                  onChange={e => setClient(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[2px] mt-8 mb-2">Parâmetros da Obra</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Responsável</label>
                <select value={responsavel} onChange={e => setResponsavel(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors">
                  <option value="pessoa física">pessoa física</option>
                  <option value="pessoa jurídica">pessoa jurídica</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Destinação</label>
                <select value={destinacao} onChange={e => setDestinacao(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors">
                  <option value="Residencial unifamiliar">Residencial unifamiliar</option>
                  <option value="Residencial multifamiliar">Residencial multifamiliar</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Tipo de Obra</label>
                  <select value={tipoObra} onChange={e => setTipoObra(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors">
                    <option value="Alvenaria">Alvenaria</option>
                    <option value="Madeira">Madeira</option>
                    <option value="Mista">Mista</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">UF</label>
                  <select value={uf} onChange={e => setUf(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors">
                    <option value="SP">SP</option><option value="RJ">RJ</option><option value="MG">MG</option><option value="PR">PR</option><option value="SC">SC</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Concreto Usinado?</label>
                <select value={concreto} onChange={e => setConcreto(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none transition-colors">
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[2px] mb-2">Áreas da Obra (m²)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Construção</label>
                <input type="number" value={areaCon || ''} onChange={e => setAreaCon(Number(e.target.value))} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Reforma</label>
                <input type="number" value={areaRef || ''} onChange={e => setAreaRef(Number(e.target.value))} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Demolição</label>
                <input type="number" value={areaDem || ''} onChange={e => setAreaDem(Number(e.target.value))} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Piscina</label>
                <input type="number" value={areaPisc || ''} onChange={e => setAreaPisc(Number(e.target.value))} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#BCB5AC] outline-none" />
              </div>
            </div>

            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[2px] mt-8 mb-2">Período para Fator de Ajuste</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Início (MM/AAAA)</label>
                <div className="flex gap-2">
                  <select value={fatorInicioMes} onChange={e => setFatorInicioMes(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none">
                    <option value="">Mês</option>
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={fatorInicioAno} onChange={e => setFatorInicioAno(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none">
                    <option value="">Ano</option>
                    {Array.from({ length: 25 }, (_, i) => (2015 + i).toString()).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Fim (MM/AAAA)</label>
                <div className="flex gap-2">
                  <select value={fatorFimMes} onChange={e => setFatorFimMes(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none">
                    <option value="">Mês</option>
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={fatorFimAno} onChange={e => setFatorFimAno(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none">
                    <option value="">Ano</option>
                    {Array.from({ length: 25 }, (_, i) => (2015 + i).toString()).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[2px] mt-8 mb-4">Certificado Digital A1 (.pfx)</h3>
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 space-y-4">
              {!certUrl ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Senha do Certificado</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input 
                        type="password" 
                        value={certPassword} 
                        onChange={e => setCertPassword(e.target.value)}
                        placeholder="Digite a senha para validar o arquivo"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-[#BCB5AC] outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept=".pfx,.p12"
                      onChange={handleCertificateUpload}
                      disabled={isProcessingCert || !certPassword}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className={cn(
                      "border-2 border-dashed rounded-2xl p-4 text-center transition-all",
                      isProcessingCert ? "border-slate-700 bg-slate-900/20" : "border-white/10 hover:border-[#BCB5AC]/30 bg-slate-900/50",
                      !certPassword && "opacity-50"
                    )}>
                      {isProcessingCert ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-4 w-4 border-2 border-[#BCB5AC] border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processando...</span>
                        </div>
                      ) : (
                        <>
                          <Key className="h-5 w-5 text-slate-500 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anexar Certificado A1</p>
                          {!certPassword && <p className="text-[9px] text-amber-500/80 mt-1 italic">Informe a senha primeiro</p>}
                        </>
                      )}
                    </div>
                  </div>
                  {certError && (
                    <div className="flex items-center gap-2 text-red-400 text-[10px] font-medium bg-red-400/5 p-2 rounded-lg border border-red-400/10">
                      <AlertTriangle className="h-3 w-3" /> {certError}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">Certificado Anexado</p>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Validado com Sucesso</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setCertUrl(null); setCertInfo(null); setCertPassword(''); }}
                      className="text-[9px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest"
                    >
                      Remover
                    </button>
                  </div>

                  {certInfo && (
                    <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Titular</p>
                        <p className="text-[10px] text-slate-300 font-medium line-clamp-1">{certInfo.subject}</p>
                      </div>
                      <div className="flex justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Vencimento</p>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <Calendar className="h-3 w-3 text-[#BCB5AC]" />
                            {new Date(certInfo.valid_to).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                            new Date(certInfo.valid_to) > new Date() ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {new Date(certInfo.valid_to) > new Date() ? 'Válido' : 'Expirado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {showResults && results && (
          <div className="p-8 border-t border-white/5 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 bg-black/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Resultado da Aferição</h3>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Relatório Analítico Consolidado</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFatorAjuste(!showFatorAjuste)} 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-widest border border-white/10"
                >
                  <TrendingDown className="h-4 w-4" /> {showFatorAjuste ? 'Ocultar Detalhes' : 'Ver Detalhes do Fator'}
                </button>
                <button 
                  onClick={() => handlePrint(summaryRef)} 
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-widest border border-white/10 shadow-lg"
                >
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">RMT (Remuneração)</p>
                <p className="text-lg font-bold text-white">{formatCurrency(calcRMT)}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Débito Original</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(inssInicial)}</p>
              </div>
              <div className="bg-[#10B981]/10 p-4 rounded-2xl border border-[#10B981]/20">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total com Ajuste</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(results.inssFinal)}</p>
              </div>
            </div>

            {showFatorAjuste && (
              <div className="bg-white rounded-2xl p-6 text-slate-900 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h4 className="font-bold text-slate-800">Detalhamento por Período</h4>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Economia</span>
                    <span className="text-lg font-black text-emerald-600">{formatCurrency(results.reducao)} ({results.percReducao}%)</span>
                  </div>
                </div>

                <div ref={summaryRef} className="overflow-x-auto">
                  <table className="w-full text-[10px] text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-y border-slate-100">
                        <th className="py-2 px-3 text-left">Mês</th>
                        <th className="py-2 px-2">Remuneração</th>
                        <th className="py-2 px-2">INSS (20%)</th>
                        <th className="py-2 px-2">Encargos</th>
                        <th className="py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((r, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 px-3 text-left font-bold">{r.mesStr}</td>
                          <td className="py-2 px-2">{formatCurrency(r.rem)}</td>
                          <td className="py-2 px-2">{formatCurrency(r.inss)}</td>
                          <td className="py-2 px-2">{formatCurrency(r.multa + r.juros + r.maed)}</td>
                          <td className="py-2 px-2 font-bold">{formatCurrency(r.inss + r.multa + r.juros + r.maed)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="py-3 px-3 text-left">TOTAIS</td>
                        <td className="py-3 px-2">{formatCurrency(results.totalRem)}</td>
                        <td className="py-3 px-2">{formatCurrency(results.totalInss)}</td>
                        <td className="py-3 px-2">{formatCurrency(results.totalMulta + results.totalJuros + results.totalMaed)}</td>
                        <td className="py-3 px-2 text-emerald-400">{formatCurrency(results.inssFinal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-8 bg-slate-900/30 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Débito Estimado</p>
              <p className="text-2xl font-black text-white">{formatCurrency(inssInicial)}</p>
            </div>
            {results && results.reducao > 0 && (
              <div className="pl-6 border-l border-white/10">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Com Fator de Ajuste</p>
                <p className="text-2xl font-black text-emerald-400">{formatCurrency(results.inssFinal)}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowResults(!showResults)}
            disabled={totalArea === 0}
            className={cn(
              "px-8 py-3 text-white text-[11px] font-black rounded-xl transition-all shadow-xl uppercase tracking-[2px]",
              showResults ? "bg-slate-700 hover:bg-slate-600 shadow-slate-900/20" : "bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/20"
            )}
          >
            {showResults ? 'Ocultar Relatório' : 'Gerar Relatório Completo'}
          </button>
        </div>
      </div>
    </div>
  );
}
