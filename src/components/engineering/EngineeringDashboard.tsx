import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { HardHat, FileSpreadsheet, SplitSquareHorizontal, FileWarning } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function EngineeringDashboard({ projectId }: { projectId: string }) {
  const [stats, setStats] = useState({
    disciplines: 0,
    documents: 0,
    pendingClashes: 0,
    openRfis: 0
  });

  const [disciplineStatusData, setDisciplineStatusData] = useState<{name: string, value: number}[]>([]);
  const [revisionsData, setRevisionsData] = useState<{date: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [projectId]);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [discRes, docsRes, clashesRes, rfisRes, revsRes] = await Promise.all([
        supabase.from('eng_disciplines').select('status').eq('project_id', projectId),
        supabase.from('eng_documents').select('id').eq('project_id', projectId),
        supabase.from('eng_clashes').select('status').eq('project_id', projectId),
        supabase.from('eng_rfis').select('status').eq('project_id', projectId),
        supabase.from('eng_revisions').select('created_at, documents!inner(project_id)').eq('documents.project_id', projectId)
      ]);

      const disciplines = discRes.data || [];
      const clashes = clashesRes.data || [];
      const rfis = rfisRes.data || [];
      const revisions = revsRes.data || [];

      // Calculate Stats
      setStats({
        disciplines: disciplines.length,
        documents: docsRes.data?.length || 0,
        pendingClashes: clashes.filter(c => c.status !== 'Resolvido').length,
        openRfis: rfis.filter(r => r.status === 'Aberto').length
      });

      // Calculate Status Data for PieChart
      const statusCounts: Record<string, number> = {};
      disciplines.forEach(d => {
        statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      });
      const pieData = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
      }));
      setDisciplineStatusData(pieData);

      // Calculate Revisions over time for BarChart
      const revsByDate: Record<string, number> = {};
      // Group by month-year or just date if small
      revisions.forEach(r => {
        if (r.created_at) {
          const date = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
          revsByDate[date] = (revsByDate[date] || 0) + 1;
        }
      });
      const barData = Object.keys(revsByDate).map(key => ({
        date: key,
        count: revsByDate[key]
      }));
      setRevisionsData(barData);

    } catch (err) {
      console.error('Error fetching dashboard data', err);
    }

    setLoading(false);
  };

  const statCards = [
    { label: 'Disciplinas', value: stats.disciplines, icon: HardHat, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Documentos', value: stats.documents, icon: FileSpreadsheet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Compatibilizações Pendentes', value: stats.pendingClashes, icon: SplitSquareHorizontal, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'RFI Abertos', value: stats.openRfis, icon: FileWarning, color: 'text-error', bg: 'bg-error/10' },
  ];

  const COLORS = ['#22FF88', '#3B82F6', '#F97316', '#EF4444', '#8B5CF6', '#14B8A6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-surface-container-low border border-outline rounded-[24px] p-6 hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-on-surface mb-1">{stat.value}</p>
            <p className="text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Evolução das Revisões - BarChart */}
        <div className="bg-surface-container-low border border-outline rounded-[32px] p-8 min-h-[400px] flex flex-col">
          <p className="text-sm font-display uppercase tracking-widest text-on-surface-variant mb-8 text-center">Evolução das Revisões</p>
          {revisionsData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-on-surface-variant uppercase tracking-[3px] opacity-50">
              <p>Nenhum dado de revisão encontrado</p>
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revisionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A1D20', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="count" name="Revisões" fill="#22FF88" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status das Disciplinas - PieChart */}
        <div className="bg-surface-container-low border border-outline rounded-[32px] p-8 min-h-[400px] flex flex-col">
          <p className="text-sm font-display uppercase tracking-widest text-on-surface-variant mb-8 text-center">Status das Disciplinas</p>
          {disciplineStatusData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-on-surface-variant uppercase tracking-[3px] opacity-50">
              <p>Nenhuma disciplina cadastrada</p>
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={disciplineStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {disciplineStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A1D20', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
