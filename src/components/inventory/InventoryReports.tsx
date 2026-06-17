import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useProjectData } from '../../hooks/useProjectData';
import { FileSpreadsheet, Package, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

interface InventoryReportsProps {
  projectId: string;
}

export function InventoryReports({ projectId }: InventoryReportsProps) {
  const { movements, materials, employees } = useInventory(projectId);
  const { budgetItems } = useProjectData(projectId);
  const [activeReport, setActiveReport] = useState<'consumption' | 'waste' | 'employee'>('consumption');

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const renderConsumptionReport = () => {
    // Agrupar Saídas por budget_item
    const outMovements = movements.filter(m => m.type === 'out' && m.budget_item_id);
    const consumptionByItem = budgetItems.map(item => {
      const itemMovements = outMovements.filter(m => m.budget_item_id === item.id);
      
      const materialTotals = itemMovements.reduce((acc, m) => {
        if (!m.material) return acc;
        const matId = m.material.id;
        if (!acc[matId]) {
          acc[matId] = {
            description: m.material.description,
            unit: m.material.unit,
            totalQuantity: 0
          };
        }
        acc[matId].totalQuantity += Number(m.quantity);
        return acc;
      }, {} as Record<string, { description: string, unit: string, totalQuantity: number }>);

      return {
        item,
        materials: Object.values(materialTotals)
      };
    }).filter(group => group.materials.length > 0);

    const handleExport = () => {
      const exportData = consumptionByItem.flatMap(group => 
        group.materials.map(mat => ({
          'Etapa da Obra (Item)': `${group.item.code} - ${group.item.description}`,
          'Material': mat.description,
          'Quantidade Consumida': mat.totalQuantity,
          'Unidade': mat.unit
        }))
      );
      exportToExcel(exportData, 'relatorio_consumo_etapa');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-2xl border border-outline">
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-on-surface">Consumo por Etapa</h3>
            <p className="text-xs text-on-surface-variant">Quantidade de materiais utilizados em cada item da EAP.</p>
          </div>
          <button onClick={handleExport} className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-background rounded-xl transition-all border border-primary/20 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <FileSpreadsheet className="h-4 w-4" /> Exportar
          </button>
        </div>

        {consumptionByItem.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8">Nenhum consumo registrado por etapa.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consumptionByItem.map((group) => (
              <div key={group.item.id} className="bg-surface-container-low border border-outline rounded-2xl p-6">
                <h4 className="font-bold text-on-surface mb-4 pb-2 border-b border-outline">
                  {group.item.code} - {group.item.description}
                </h4>
                <div className="space-y-3">
                  {group.materials.map((mat, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-on-surface-variant">{mat.description}</span>
                      <span className="text-sm font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-lg">
                        {mat.totalQuantity} {mat.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWasteReport = () => {
    // Comprado (Entradas) vs Utilizado (Saídas + Cautelas)
    const wasteData = materials.map(mat => {
      const matMovements = movements.filter(m => m.material_id === mat.id);
      const totalIn = matMovements.filter(m => m.type === 'in' || m.type === 'adjustment').reduce((acc, m) => acc + Number(m.quantity), 0);
      const totalOut = matMovements.filter(m => m.type === 'out' || m.type === 'cautela').reduce((acc, m) => acc + Number(m.quantity), 0);
      
      const currentStock = mat.current_stock;
      
      // O desperdício teórico pode ser calculado por uma diferença entre o comprado e o utilizado caso a obra termine
      // Ou pela proporção de consumo no tempo. Aqui faremos o Básico Comprado vs Consumido.
      const percentageUsed = totalIn > 0 ? (totalOut / totalIn) * 100 : 0;

      return {
        material: mat,
        totalIn,
        totalOut,
        currentStock,
        percentageUsed
      };
    }).filter(d => d.totalIn > 0 || d.totalOut > 0);

    const handleExport = () => {
      const exportData = wasteData.map(d => ({
        'Material': d.material.description,
        'Total Comprado (Entradas)': d.totalIn,
        'Total Utilizado (Saídas)': d.totalOut,
        'Saldo Físico': d.currentStock,
        'Unidade': d.material.unit,
        '% Utilizada': `${d.percentageUsed.toFixed(2)}%`
      }));
      exportToExcel(exportData, 'relatorio_desperdicio_saldo');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-2xl border border-outline">
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-on-surface">Balanço de Materiais</h3>
            <p className="text-xs text-on-surface-variant">Relação entre Total Comprado (Entradas) vs Total Utilizado (Saídas).</p>
          </div>
          <button onClick={handleExport} className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-background rounded-xl transition-all border border-primary/20 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <FileSpreadsheet className="h-4 w-4" /> Exportar
          </button>
        </div>

        <div className="bg-surface-container-low border border-outline rounded-[24px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline bg-surface-container-high/50">
                <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Material</th>
                <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Entradas</th>
                <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Saídas (Consumo)</th>
                <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Saldo Físico</th>
                <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[3px]">Progresso de Consumo</th>
              </tr>
            </thead>
            <tbody>
              {wasteData.map(d => (
                <tr key={d.material.id} className="border-b border-outline/50 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-sm text-on-surface">{d.material.description}</td>
                  <td className="p-4 text-sm text-emerald-500 font-bold">{d.totalIn} {d.material.unit}</td>
                  <td className="p-4 text-sm text-orange-500 font-bold">{d.totalOut} {d.material.unit}</td>
                  <td className="p-4 text-sm text-on-surface font-bold">{d.currentStock} {d.material.unit}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", d.percentageUsed > 90 ? "bg-error" : d.percentageUsed > 75 ? "bg-orange-500" : "bg-primary")} 
                          style={{ width: `${Math.min(d.percentageUsed, 100)}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold w-12 text-right">{d.percentageUsed.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEmployeeReport = () => {
    // Cautelas agrupadas por funcionário
    const cautelaMovements = movements.filter(m => m.type === 'cautela' && m.employee_id);
    
    const employeeConsumption = employees.map(emp => {
      const empMovements = cautelaMovements.filter(m => m.employee_id === emp.id);
      
      const materialTotals = empMovements.reduce((acc, m) => {
        if (!m.material) return acc;
        const matId = m.material.id;
        if (!acc[matId]) {
          acc[matId] = {
            description: m.material.description,
            unit: m.material.unit,
            totalQuantity: 0
          };
        }
        acc[matId].totalQuantity += Number(m.quantity);
        return acc;
      }, {} as Record<string, { description: string, unit: string, totalQuantity: number }>);

      return {
        employee: emp,
        materials: Object.values(materialTotals)
      };
    }).filter(group => group.materials.length > 0);

    const handleExport = () => {
      const exportData = employeeConsumption.flatMap(group => 
        group.materials.map(mat => ({
          'Funcionário': group.employee.name,
          'Cargo': group.employee.role,
          'Material Retirado': mat.description,
          'Quantidade Total': mat.totalQuantity,
          'Unidade': mat.unit
        }))
      );
      exportToExcel(exportData, 'relatorio_cautelas_funcionario');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-2xl border border-outline">
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-on-surface">Retiradas por Funcionário (Cautelas)</h3>
            <p className="text-xs text-on-surface-variant">Controle do que cada membro da equipe retirou no almoxarifado.</p>
          </div>
          <button onClick={handleExport} className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-background rounded-xl transition-all border border-primary/20 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <FileSpreadsheet className="h-4 w-4" /> Exportar
          </button>
        </div>

        {employeeConsumption.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8">Nenhuma cautela registrada para funcionários.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employeeConsumption.map((group) => (
              <div key={group.employee.id} className="bg-surface-container-low border border-outline rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-outline">
                  <div className="h-10 w-10 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center font-display font-bold">
                    {group.employee.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface leading-tight">{group.employee.name}</h4>
                    <p className="text-[10px] font-display uppercase tracking-wider text-on-surface-variant">{group.employee.role}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.materials.map((mat, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-background/50 p-2 rounded-lg">
                      <span className="text-sm text-on-surface-variant">{mat.description}</span>
                      <span className="text-xs font-bold text-purple-500">
                        {mat.totalQuantity} {mat.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Botões de Seleção de Relatório */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setActiveReport('consumption')}
          className={cn(
            "px-6 py-4 rounded-xl text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 border flex items-center gap-2",
            activeReport === 'consumption'
              ? "bg-primary/10 text-primary border-primary shadow-[0_0_20px_rgba(34,255,136,0.15)]"
              : "bg-surface-container-low text-on-surface-variant border-outline hover:border-primary/50 hover:text-on-surface"
          )}
        >
          <BarChart2 className="h-4 w-4" /> Consumo por Etapa
        </button>

        <button
          onClick={() => setActiveReport('waste')}
          className={cn(
            "px-6 py-4 rounded-xl text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 border flex items-center gap-2",
            activeReport === 'waste'
              ? "bg-primary/10 text-primary border-primary shadow-[0_0_20px_rgba(34,255,136,0.15)]"
              : "bg-surface-container-low text-on-surface-variant border-outline hover:border-primary/50 hover:text-on-surface"
          )}
        >
          <RefreshCw className="h-4 w-4" /> Balanço / Desperdício
        </button>

        <button
          onClick={() => setActiveReport('employee')}
          className={cn(
            "px-6 py-4 rounded-xl text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 border flex items-center gap-2",
            activeReport === 'employee'
              ? "bg-purple-500/10 text-purple-500 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              : "bg-surface-container-low text-on-surface-variant border-outline hover:border-primary/50 hover:text-on-surface"
          )}
        >
          <CheckCircle2 className="h-4 w-4" /> Cautelas por Funcionário
        </button>
      </div>

      <div className="pt-6 border-t border-outline">
        {activeReport === 'consumption' && renderConsumptionReport()}
        {activeReport === 'waste' && renderWasteReport()}
        {activeReport === 'employee' && renderEmployeeReport()}
      </div>

    </div>
  );
}
