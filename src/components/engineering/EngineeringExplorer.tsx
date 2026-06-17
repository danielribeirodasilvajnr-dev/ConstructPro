import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EngDiscipline, EngDirectory, EngDocument, EngRevision } from '../../lib/types';
import { 
  Folder, FolderOpen, File, FileText, ChevronRight, ChevronDown, 
  Upload, Download, Trash2, History, Plus, MoreVertical, 
  FileSpreadsheet, Image as ImageIcon, FileBox, FolderGit2, HardHat
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectData } from '../../hooks/useProjectData';
import { AlertModal } from '../ui/AlertModal';

interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'discipline' | 'directory';
  children: TreeNode[];
  data?: any;
  isOpen?: boolean;
}

export function EngineeringExplorer({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  
  // Data State
  const [disciplines, setDisciplines] = useState<EngDiscipline[]>([]);
  const [directories, setDirectories] = useState<EngDirectory[]>([]);
  const [documents, setDocuments] = useState<EngDocument[]>([]);
  const [revisions, setRevisions] = useState<Record<string, EngRevision[]>>({});
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{id: string, name: string}[]>([]);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  
  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
  
  // Forms
  const [folderName, setFolderName] = useState('');
  const [disciplineName, setDisciplineName] = useState('');
  const [uploadData, setUploadData] = useState<{file: File | null, name: string, notes: string}>({ file: null, name: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any}>({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all related data
    const [discRes, dirRes, docRes] = await Promise.all([
      supabase.from('eng_disciplines').select('*').eq('project_id', projectId).order('name'),
      supabase.from('eng_directories').select('*').eq('project_id', projectId).order('name'),
      supabase.from('eng_documents').select('*').eq('project_id', projectId).order('name')
    ]);

    const fetchedDisciplines = discRes.data || [];
    const fetchedDirs = dirRes.data || [];
    const fetchedDocs = docRes.data || [];

    setDisciplines(fetchedDisciplines);
    setDirectories(fetchedDirs);
    setDocuments(fetchedDocs);

    // Fetch Revisions
    const docIds = fetchedDocs.map(d => d.id);
    if (docIds.length > 0) {
      const { data: revData } = await supabase.from('eng_revisions').select('*').in('document_id', docIds).order('created_at', { ascending: false });
      if (revData) {
        const revsByDoc: Record<string, EngRevision[]> = {};
        revData.forEach(r => {
          if (!revsByDoc[r.document_id]) revsByDoc[r.document_id] = [];
          revsByDoc[r.document_id].push(r);
        });
        setRevisions(revsByDoc);
      }
    }

    buildTree(fetchedDisciplines, fetchedDirs);
    setLoading(false);
  };

  const buildTree = (discs: EngDiscipline[], dirs: EngDirectory[]) => {
    // Root Node -> Disciplines
    const rootNode: TreeNode = {
      id: 'root_disciplinas',
      name: 'Disciplinas',
      type: 'root',
      isOpen: true,
      children: discs.map(d => {
        // Find directories for this discipline
        const buildDirTree = (parentId: string | null, discId: string): TreeNode[] => {
          return dirs
            .filter(dir => dir.parent_id === parentId && dir.discipline_id === discId)
            .map(dir => ({
              id: dir.id,
              name: dir.name,
              type: 'directory',
              data: dir,
              isOpen: false,
              children: buildDirTree(dir.id, discId)
            }));
        };

        return {
          id: d.id,
          name: d.name,
          type: 'discipline',
          data: d,
          isOpen: false,
          children: buildDirTree(null, d.id)
        };
      })
    };

    setTree([rootNode]);
    
    // Select root if nothing selected
    if (!selectedNode) {
      handleSelectNode(rootNode, [rootNode]);
    }
  };

  const toggleNode = (nodeId: string, currentTree: TreeNode[]): TreeNode[] => {
    return currentTree.map(node => {
      if (node.id === nodeId) {
        return { ...node, isOpen: !node.isOpen };
      }
      if (node.children) {
        return { ...node, children: toggleNode(nodeId, node.children) };
      }
      return node;
    });
  };

  const handleSelectNode = (node: TreeNode, path: TreeNode[]) => {
    setSelectedNode(node);
    setBreadcrumb(path.map(p => ({ id: p.id, name: p.name })));
    setTree(prev => toggleNode(node.id, prev));
  };

  const renderTree = (nodes: TreeNode[], path: TreeNode[] = []) => {
    return (
      <ul className="pl-4 space-y-1">
        {nodes.map(node => {
          const currentPath = [...path, node];
          const isSelected = selectedNode?.id === node.id;
          const hasChildren = node.children && node.children.length > 0;

          return (
            <li key={node.id}>
              <div 
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-surface-container-high text-on-surface-variant"
                )}
                onClick={() => handleSelectNode(node, currentPath)}
              >
                <div 
                  className="p-1 hover:bg-surface-container-highest rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTree(prev => toggleNode(node.id, prev));
                  }}
                >
                  {hasChildren ? (
                    node.isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <div className="w-3.5" /> // Spacer
                  )}
                </div>
                
                {node.type === 'root' ? (
                  <FolderGit2 className={cn("h-4 w-4", isSelected ? "text-primary" : "text-on-surface-variant")} />
                ) : node.type === 'discipline' ? (
                  <HardHat className={cn("h-4 w-4", isSelected ? "text-primary" : "text-on-surface-variant")} />
                ) : (
                  node.isOpen ? <FolderOpen className={cn("h-4 w-4", isSelected ? "text-primary" : "text-blue-400")} /> : <Folder className={cn("h-4 w-4", isSelected ? "text-primary" : "text-blue-400")} />
                )}
                
                <span className={cn("text-xs font-medium truncate select-none", isSelected && "font-bold")}>{node.name}</span>
              </div>
              
              {node.isOpen && hasChildren && renderTree(node.children, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  // Actions
  const handleCreateDiscipline = async () => {
    if (!disciplineName) return;
    try {
      await supabase.from('eng_disciplines').insert([{
        project_id: projectId,
        name: disciplineName,
        status: 'Não iniciado'
      }]);
      setIsDisciplineModalOpen(false);
      setDisciplineName('');
      fetchData();
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName || !selectedNode) return;
    
    // Can only create folders inside a discipline or another folder
    if (selectedNode.type === 'root') {
      setAlertConfig({ isOpen: true, title: 'Erro', message: 'Selecione uma disciplina para criar a pasta.', type: 'error' });
      return;
    }

    try {
      const disciplineId = selectedNode.type === 'discipline' ? selectedNode.id : selectedNode.data.discipline_id;
      const parentId = selectedNode.type === 'directory' ? selectedNode.id : null;

      await supabase.from('eng_directories').insert([{
        project_id: projectId,
        discipline_id: disciplineId,
        parent_id: parentId,
        name: folderName
      }]);
      
      setIsFolderModalOpen(false);
      setFolderName('');
      fetchData();
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(t)) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (['xls', 'xlsx'].includes(t)) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    if (['dwg', 'dxf', 'rvt', 'ifc'].includes(t)) return <FileBox className="h-4 w-4 text-purple-500" />;
    return <File className="h-4 w-4 text-on-surface-variant" />;
  };

  // Get contents for the right panel based on selected node
  const getRightPanelContents = () => {
    if (!selectedNode) return { dirs: [], docs: [] };

    let currentDirs: EngDirectory[] = [];
    let currentDocs: EngDocument[] = [];

    if (selectedNode.type === 'root') {
      // Show disciplines? Or just empty? Show disciplines as folders
      return { dirs: [], docs: [] }; 
    } else if (selectedNode.type === 'discipline') {
      currentDirs = directories.filter(d => d.discipline_id === selectedNode.id && !d.parent_id);
      currentDocs = documents.filter(d => d.discipline_id === selectedNode.id && !d.directory_id);
    } else if (selectedNode.type === 'directory') {
      currentDirs = directories.filter(d => d.parent_id === selectedNode.id);
      currentDocs = documents.filter(d => d.directory_id === selectedNode.id);
    }

    return { dirs: currentDirs, docs: currentDocs };
  };

  const { dirs: rightDirs, docs: rightDocs } = getRightPanelContents();

  // Handle Upload
  const handleUploadSubmit = async () => {
    const { file, name, notes } = uploadData;
    if (!file || !name || !selectedNode || selectedNode.type === 'root') {
      setAlertConfig({ isOpen: true, title: 'Erro', message: 'Selecione um local válido e anexe um arquivo.', type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const disciplineId = selectedNode.type === 'discipline' ? selectedNode.id : selectedNode.data.discipline_id;
      const directoryId = selectedNode.type === 'directory' ? selectedNode.id : null;
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/${disciplineId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('engineering_docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      const user = (await supabase.auth.getUser()).data.user;

      const { data: newDoc, error: insertError } = await supabase.from('eng_documents').insert([{
        project_id: projectId,
        discipline_id: disciplineId,
        directory_id: directoryId,
        name: name,
        type: fileExt || 'unknown',
        version: 'REV00',
        file_path: filePath,
        notes: notes
      }]).select().single();

      if (insertError) throw insertError;

      if (newDoc) {
        await supabase.from('eng_revisions').insert([{
          document_id: newDoc.id,
          version: 'REV00',
          user_id: user?.id,
          file_path: filePath,
          changes_description: 'Upload inicial'
        }]);
      }

      setIsUploadModalOpen(false);
      setUploadData({ file: null, name: '', notes: '' });
      fetchData();
      setAlertConfig({ isOpen: true, title: 'Sucesso', message: 'Arquivo enviado com sucesso.', type: 'success' });
    } catch (err: any) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: err.message, type: 'error' });
    }
    setUploading(false);
  };

  const handleDownload = async (path: string, name: string) => {
    try {
      const { data, error } = await supabase.storage.from('engineering_docs').createSignedUrl(path, 60);
      if (error) throw error;
      
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Erro', message: 'Não foi possível baixar o arquivo.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[800px] bg-surface border border-outline rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      
      {/* LEFT SIDEBAR - TREE VIEW */}
      <div className="w-full lg:w-80 bg-surface-container-low border-r border-outline flex flex-col">
        <div className="p-4 border-b border-outline bg-surface-container-high/50 flex justify-between items-center">
          <h3 className="text-xs font-display font-bold uppercase tracking-[2px] text-on-surface">Diretórios</h3>
          <button 
            onClick={() => setIsDisciplineModalOpen(true)}
            className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors text-on-surface-variant"
            title="Nova Disciplina"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col bg-surface relative">
        {/* Header / Breadcrumb */}
        <div className="p-4 border-b border-outline flex items-center justify-between bg-surface/50 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs font-medium text-on-surface-variant">
            {breadcrumb.map((b, idx) => (
              <React.Fragment key={b.id}>
                {idx > 0 && <span className="text-outline">/</span>}
                <span className={cn(
                  "whitespace-nowrap px-2 py-1 rounded-md transition-colors cursor-pointer",
                  idx === breadcrumb.length - 1 ? "bg-primary/10 text-primary font-bold" : "hover:bg-surface-container-high"
                )}>
                  {b.name}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-outline flex flex-wrap gap-4 items-center bg-surface-container-lowest">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            disabled={!selectedNode || selectedNode.type === 'root'}
            className="flex items-center gap-2 text-[11px] font-display font-bold uppercase tracking-widest text-on-surface hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface transition-colors"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button 
            onClick={() => setIsFolderModalOpen(true)}
            disabled={!selectedNode || selectedNode.type === 'root'}
            className="flex items-center gap-2 text-[11px] font-display font-bold uppercase tracking-widest text-on-surface hover:text-blue-500 disabled:opacity-30 disabled:hover:text-on-surface transition-colors"
          >
            <FolderPlus className="h-4 w-4" /> Nova Pasta
          </button>
          
          <div className="w-px h-4 bg-outline mx-2" />
          
          <button className="flex items-center gap-2 text-[11px] font-display font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            <Archive className="h-4 w-4" /> Obsoletos
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {(!selectedNode || selectedNode.type === 'root') ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
              <Folder className="h-16 w-16 mb-4 text-on-surface-variant" />
              <p className="text-sm font-display uppercase tracking-widest text-on-surface-variant">Selecione uma disciplina ou pasta</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline bg-surface-container-lowest">
                  <th className="p-4 pl-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px] w-12"></th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px]">Título / Nome</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px] w-24">Rev</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px] w-32">Data</th>
                  <th className="p-4 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px] w-32">Status</th>
                  <th className="p-4 pr-6 text-[10px] font-display font-bold text-on-surface-variant uppercase tracking-[2px] text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {rightDirs.map(dir => (
                  <tr key={dir.id} className="hover:bg-surface-container-low cursor-pointer transition-colors" onClick={() => {
                    // Find node in tree and select it
                    const findNode = (nodes: TreeNode[]): TreeNode | null => {
                      for (const n of nodes) {
                        if (n.id === dir.id) return n;
                        if (n.children) {
                          const found = findNode(n.children);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    const node = findNode(tree);
                    if (node) {
                      const newPath = [...breadcrumb, { id: node.id, name: node.name }];
                      setSelectedNode(node);
                      setBreadcrumb(newPath);
                    }
                  }}>
                    <td className="p-4 pl-6"><Folder className="h-5 w-5 text-blue-400" /></td>
                    <td className="p-4 text-sm font-medium text-on-surface">{dir.name}</td>
                    <td className="p-4 text-on-surface-variant">--</td>
                    <td className="p-4 text-xs text-on-surface-variant">{new Date(dir.created_at || '').toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-on-surface-variant">--</td>
                    <td className="p-4 pr-6 text-right">
                       <button className="p-1.5 text-on-surface-variant hover:text-error rounded-md transition-colors" onClick={(e) => { e.stopPropagation(); /* TODO Delete Dir */ }}>
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))}
                
                {rightDocs.map(doc => (
                  <React.Fragment key={doc.id}>
                    <tr className="hover:bg-surface-container-low transition-colors group">
                      <td className="p-4 pl-6">{getFileIcon(doc.type)}</td>
                      <td className="p-4 text-sm font-medium text-on-surface uppercase">{doc.name}.{doc.type}</td>
                      <td className="p-4 text-xs font-bold text-on-surface uppercase">{doc.version}</td>
                      <td className="p-4 text-xs text-on-surface-variant">{new Date(doc.created_at || '').toLocaleDateString('pt-BR')}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-widest">
                          Aprovado
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDownload(doc.file_path, `${doc.name}.${doc.type}`)} className="p-1.5 bg-surface text-on-surface-variant hover:text-primary rounded border border-outline" title="Baixar">
                            <Download className="h-4 w-4" />
                          </button>
                          <button onClick={() => setShowHistory(showHistory === doc.id ? null : doc.id)} className={cn("p-1.5 rounded border", showHistory === doc.id ? "bg-primary text-background border-primary" : "bg-surface text-on-surface-variant border-outline hover:text-primary")} title="Histórico">
                            <History className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Revisions Sub-row */}
                    {showHistory === doc.id && (
                      <tr className="bg-surface-container-lowest border-l-4 border-l-primary">
                        <td colSpan={6} className="p-0">
                          <div className="p-4 pl-12 bg-surface/50 border-y border-outline shadow-inner">
                            <h5 className="text-[10px] font-display font-bold uppercase tracking-[2px] text-on-surface-variant mb-3">Histórico de Revisões</h5>
                            <div className="space-y-2">
                              {revisions[doc.id]?.map(rev => (
                                <div key={rev.id} className="flex items-center justify-between p-2 bg-surface border border-outline rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="px-2 py-0.5 bg-surface-container-high text-on-surface font-bold text-[10px] rounded">{rev.version}</div>
                                    <div className="text-[11px] text-on-surface-variant">{rev.changes_description || 'Versão inicial'}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-on-surface-variant uppercase">{new Date(rev.created_at || '').toLocaleDateString('pt-BR')}</span>
                                    <button onClick={() => handleDownload(rev.file_path, `${doc.name}_${rev.version}.${doc.type}`)} className="text-primary hover:text-primary/80 transition-colors p-1">
                                      <Download className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {rightDirs.length === 0 && rightDocs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-on-surface-variant">Pasta vazia</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-outline shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold mb-4 uppercase text-sm tracking-widest text-on-surface">Nova Pasta</h3>
            <input 
              autoFocus
              type="text" 
              placeholder="Nome da pasta" 
              value={folderName} 
              onChange={e => setFolderName(e.target.value)} 
              className="w-full bg-surface border border-outline rounded-lg px-4 py-2 mb-6 text-sm outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsFolderModalOpen(false)} className="text-xs font-bold text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-lg">Cancelar</button>
              <button onClick={handleCreateFolder} className="text-xs font-bold bg-primary text-background px-6 py-2 rounded-lg hover:opacity-90">Criar</button>
            </div>
          </div>
        </div>
      )}

      {isDisciplineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-outline shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold mb-4 uppercase text-sm tracking-widest text-on-surface">Nova Disciplina</h3>
            <input 
              autoFocus
              type="text" 
              placeholder="Ex: Arquitetura, Estrutural" 
              value={disciplineName} 
              onChange={e => setDisciplineName(e.target.value)} 
              className="w-full bg-surface border border-outline rounded-lg px-4 py-2 mb-6 text-sm outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDisciplineModalOpen(false)} className="text-xs font-bold text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-lg">Cancelar</button>
              <button onClick={handleCreateDiscipline} className="text-xs font-bold bg-primary text-background px-6 py-2 rounded-lg hover:opacity-90">Criar</button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 w-full max-w-md border border-outline shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold mb-6 uppercase text-lg tracking-tight text-on-surface">Upload de Arquivo</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Arquivo</label>
                <div className="mt-1 border-2 border-dashed border-outline rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                  <input type="file" onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })} className="hidden" id="file-upload-exp" />
                  <label htmlFor="file-upload-exp" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-6 w-6 text-on-surface-variant mb-2" />
                    <span className="text-xs font-bold text-on-surface">{uploadData.file ? uploadData.file.name : 'Selecionar Arquivo'}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Título</label>
                <input type="text" value={uploadData.name} onChange={e => setUploadData({...uploadData, name: e.target.value})} className="w-full bg-surface border border-outline rounded-lg px-4 py-2 text-sm outline-none focus:border-primary mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Observações</label>
                <textarea value={uploadData.notes} onChange={e => setUploadData({...uploadData, notes: e.target.value})} className="w-full bg-surface border border-outline rounded-lg px-4 py-2 text-sm outline-none focus:border-primary mt-1 resize-none" rows={2} />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsUploadModalOpen(false)} className="text-xs font-bold text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-lg" disabled={uploading}>Cancelar</button>
              <button onClick={handleUploadSubmit} disabled={uploading} className="text-xs font-bold bg-primary text-background px-6 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
                {uploading && <div className="h-3 w-3 border border-background border-t-transparent rounded-full animate-spin" />}
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({...alertConfig, isOpen: false})} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
    </div>
  );
}

// Missing icons fallback
const FolderPlus = Plus;
const Archive = History;
