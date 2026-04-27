// ========================================================
// PCI Data - Dados estáticos e listas da planilha PCI CAIXA
// Réplica fiel da aba "Lista" e constantes da planilha
// ========================================================

// --- Listas de Dropdown (Aba "Lista") ---

export const LISTA_TETO = [
  '(escolha)', 'Laje', 'Forro PVC', 'Forro Gesso', 'Forro Madeira',
  'Laje+Forro', 'Outros'
];

export const LISTA_COBERTURA = [
  '(escolha)', 'Telha Cerâmica c/ Platibanda', 'Telha Concreto c/ Platibanda',
  'Telha Metálica c/ Platibanda', 'Telha de Fibrocimto. s/ Platibanda',
  'Telha de Barro/Concreto', 'Laje Impermeabilizada', 'Outros'
];

export const LISTA_REVEST_PAREDES_EXT = [
  '(escolha)', 'Reboco+Massa+Pintura', 'Reboco+Pintura', 'Cerâmica/Porcelanato',
  'Tijolo/Blc. Apar. Tratado/Imperm.', 'Outros'
];

export const LISTA_ESQUADRIAS_EXT = [
  '(escolha)', 'Alumínio', 'Ferro', 'PVC', 'Madeira', 'Concreto', 'Aço', 'Outros'
];

export const LISTA_REVEST_PISO_MOLHADAS = [
  '(escolha)', 'Cerâmica 1ª', 'Cerâmica 2ª', 'Emborrachado',
  'Porcelanato 2ª', 'Granito/Mármore 2ª', 'Pintura/Textura', 'Grafiato'
];

export const LISTA_REVEST_PISO_SECAS = [
  '(escolha)', 'Cerâmica 1ª', 'Cerâmica 2ª', 'Porcelanato 1ª',
  'Porcelanato 2ª', 'Granito/Mármore', 'Outros'
];

export const LISTA_PISO_AREAS_MOLHADAS = [
  '(escolha)', 'Cerâmica 1ª', 'Cerâmica 2ª', 'Vinílico',
  'Emborrachado', 'Porcelanato 1ª', 'Porcelanato 2ª',
  'Laminado', 'Granito/Mármore', 'Outros'
];

export const LISTA_LOUCAS_METAIS = [
  '(escolha)', 'Linha Popular', 'Linha Média', 'Linha Luxo'
];

export const LISTA_ESGOTO = [
  '(escolha)', 'Rede Pública', 'Fossa e Sumidouro', 'Outra'
];

export const LISTA_ENERGIA_ALT = [
  '(escolha)', 'Solar', 'Eólica', 'Outra'
];

export const LISTA_TIPO_VAGAS = [
  '(escolha)', 'Interna coberta', 'Externa coberta',
  'Externa descoberta'
];

export const LISTA_COZINHA = [
  '(escolha)', 'Cozinha separada', 'Cozinha+Copa', 'Cozinha americana'
];

export const LISTA_AGUA_QUENTE = [
  '(escolha)', 'Chuveiro elétrico', 'Aquecimento à gás'
];

export const LISTA_SISTEMA_CONSTRUTIVO = [
  '(escolha)',
  'Conv:Aço estrutural/Blcs.vedação',
  'Conv:Estrutura de concreto/Blcs.vedação',
  'Conv:Estrutura de madeira/Blcs.vedação',
  'Conv:Paredes de concreto NBR nº 16055/16475',
  'Conv:Wood Framing',
  'Conv:Steel Framing',
  'Conv:Vedação Painel leve modular_NBR 17073',
  'Inov:Parede moldada local c/componente de EPS',
  'Inov:Parede com blocos de EPS',
  'Inov:Madeira (componente de vedação)',
  'Outros'
];

export const LISTA_CUSTO_REF = [
  '(escolha)', 'CUB', 'PINI', 'SINAPI'
];

export const LISTA_PADRAO = [
  '(escolha)', 'Baixo', 'Normal', 'Alto'
];

export const LISTA_FINALIDADE = [
  '(escolha)', 'Aq.Terreno e Constr.', 'Constr.Terr.Próprio', 'Ampliação', 'Melhoria'
];

export const LISTA_DESTINACAO = [
  '(escolha)', 'Residencial', 'Condomínio'
];

export const LISTA_UFS = [
  '', 'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ',
  'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

export const LISTA_EXECUTOR = [
  '(escolha)', 'Construtora', 'Autoc. Assistida', 'Autoc. Não Assistida'
];

// --- Serviços de Custo (Rows 101-120 da planilha) ---
export const SERVICOS_CUSTO = [
  { num: 1, nome: 'Barracão+lig. provisórias(água/luz)+projetos/aprovs.', minPct: 1.13, maxPct: 3.97 },
  { num: 2, nome: 'Infraestrutura (estacas, brocas, baldrames, sapatas)', minPct: 3.07, maxPct: 7.43 },
  { num: 3, nome: 'Supraestrutura (Vigas, pilares, cintas, escadas)', minPct: 12.17, maxPct: 17.67 },
  { num: 4, nome: 'Paredes e Painéis', minPct: 4.80, maxPct: 10.67 },
  { num: 5, nome: 'Esquadrias', minPct: 4.16, maxPct: 13.27 },
  { num: 6, nome: 'Vidros e Plásticos', minPct: 0, maxPct: 2.45 },
  { num: 7, nome: 'Coberturas (estrutura e telhas)', minPct: 0, maxPct: 12.94 },
  { num: 8, nome: 'Impermeabilizações', minPct: 0, maxPct: 10.10 },
  { num: 9, nome: 'Revestimentos Internos', minPct: 6.81, maxPct: 9.32 },
  { num: 10, nome: 'Forros', minPct: 0, maxPct: 2.18 },
  { num: 11, nome: 'Revestimentos Externos', minPct: 3.87, maxPct: 5.30 },
  { num: 12, nome: 'Pinturas', minPct: 3.63, maxPct: 6.47 },
  { num: 13, nome: 'Pisos', minPct: 8.41, maxPct: 11.51 },
  { num: 14, nome: 'Acabamentos (soleiras, rodapés, peitoril etc.)', minPct: 1.01, maxPct: 1.38 },
  { num: 15, nome: 'Instalações Elétricas e Telefônicas', minPct: 3.75, maxPct: 4.85 },
  { num: 16, nome: 'Instalações Hidráulicas', minPct: 3.63, maxPct: 4.27 },
  { num: 17, nome: 'Instalações: Esgoto e Águas Pluviais', minPct: 3.65, maxPct: 4.30 },
  { num: 18, nome: 'Louças e Metais', minPct: 4.14, maxPct: 4.87 },
  { num: 19, nome: 'Complementos (limpeza final e calafete)', minPct: 0.24, maxPct: 2.29 },
  { num: 20, nome: 'Outros (discriminar em Serviços Adicionais, abaixo)', minPct: 0, maxPct: 10.00 },
];

// --- Infraestrutura urbana (Aba Regras) ---
export const INFRA_URBANA = [
  { id: 'agua', label: 'Abastecimento água', opcoes: ['(escolha)', 'disponível', 'satisfatória após futura implantação'] },
  { id: 'esgoto', label: 'Rede de esgoto pública', opcoes: ['(escolha)', 'disponível', 'dispensável', 'satisfatória após futura implantação'] },
  { id: 'energia', label: 'Abastecimento de energia elétrica', opcoes: ['(escolha)', 'disponível', 'satisfatória após futura implantação'] },
  { id: 'lixo', label: 'Coleta de lixo', opcoes: ['(escolha)', 'disponível', 'não disponível', 'satisfatória após futura implantação'] },
  { id: 'telefone', label: 'Telefone', opcoes: ['(escolha)', 'disponível', 'satisfatória após futura implantação'] },
  { id: 'iluminacao', label: 'Iluminação pública', opcoes: ['(escolha)', 'disponível', 'satisfatória após futura implantação'] },
  { id: 'pavimentacao', label: 'Pavimentação', opcoes: ['(escolha)', 'disponível', 'satisfatória após futura implantação'] },
  { id: 'guias', label: 'Guias e sarjetas', opcoes: ['(escolha)', 'disponível', 'satisfatória após futura implantação'] },
  { id: 'gas', label: 'Abastecimento de gás', opcoes: ['(escolha)', 'disponível', 'dispensável', 'satisfatória após futura implantação'] },
  { id: 'pluviais', label: 'Rede de águas pluviais', opcoes: ['(escolha)', 'disponível', 'dispensável', 'satisfatória após futura implantação'] },
  { id: 'transporte', label: 'Transporte coletivo', opcoes: ['(escolha)', 'disponível', 'não disponível', 'satisfatória após futura implantação'] },
];

// --- Tipo de estado inicial do formulário PCI ---
export interface PCIFormData {
  // Identificação
  proponente_nome: string;
  proponente_email: string;
  proponente_cpf_cnpj: string;
  proponente_telefone: string;
  rtp_nome: string;
  rtp_email: string;
  rtp_conselho: string;
  rtp_uf: string;
  rtp_cpf: string;
  rtp_telefone: string;
  rte_nome: string;
  rte_email: string;
  rte_conselho: string;
  rte_uf: string;
  rte_cpf: string;
  rte_telefone: string;
  // Imóvel
  imovel_endereco: string;
  imovel_complemento: string;
  imovel_bairro: string;
  imovel_cep: string;
  imovel_municipio: string;
  imovel_uf: string;
  imovel_matricula: string;
  imovel_ori: string;
  imovel_coord_lat: string;
  imovel_coord_lon: string;
  imovel_construtora: string;
  imovel_construtora_cnpj: string;
  imovel_finalidade: string;
  // Áreas
  area_coberta_padrao: string;
  area_permeavel: string;
  area_acessoria_coberta: string;
  area_terreno: string;
  valor_terreno: string;
  // Projeto - Acabamento
  destinacao_imovel: string;
  sistema_construtivo: string;
  sistema_construtivo_outros: string;
  num_datec: string;
  cobertura_tipo: string;
  cobertura_tipo2: string;
  teto: string;
  pavtos: string;
  quartos: string;
  suites: string;
  salas: string;
  vagas: string;
  tipo_vagas: string;
  acabamento_paredes_ext: string;
  loucas_metais: string;
  area_servico: string;
  cozinha: string;
  agua_quente: string;
  acabamento_paredes_int: string;
  paredes_areas_secas: string;
  calefacao: string;
  sustentabilidade: string;
  implantacao: string;
  revest_paredes_molhadas: string;
  revest_piso_secas: string;
  revest_piso_molhadas: string;
  divisao_interna: string;
  esquadrias_ext: string;
  esquadrias_int: string;
  abastecimento_agua: string;
  outros_acabamento: string;
  drenagem: string;
  coleta_esgoto: string;
  ger_energia: string;
  // Documentação
  doc_certidao: string;
  doc_alvara: string;
  doc_alvara_data: string;
  doc_art_proj: string;
  doc_art_proj_num: string;
  doc_art_exec: string;
  doc_art_exec_num: string;
  doc_proj_legal: string;
  terreno_proprio: string;
  // Custos (20 itens)
  custos: number[];
  bdi_pct: number;
  executor_obra: string;
  // Serviços adicionais (10 linhas)
  servicos_adicionais: { nome: string; custo: number }[];
  // Cronograma (26 meses)
  cronograma_pct: number[];
  // Infraestrutura urbana
  infra: Record<string, string>;
  // Outros
  descricao_obras_executadas: string;
  observacoes: string;
  local_data: string;
}

export const INITIAL_PCI_DATA: PCIFormData = {
  proponente_nome: '',
  proponente_email: '',
  proponente_cpf_cnpj: '',
  proponente_telefone: '',
  rtp_nome: '',
  rtp_email: '',
  rtp_conselho: '',
  rtp_uf: '',
  rtp_cpf: '',
  rtp_telefone: '',
  rte_nome: '',
  rte_email: '',
  rte_conselho: '',
  rte_uf: '',
  rte_cpf: '',
  rte_telefone: '',
  imovel_endereco: '',
  imovel_complemento: '',
  imovel_bairro: '',
  imovel_cep: '',
  imovel_municipio: '',
  imovel_uf: '',
  imovel_matricula: '',
  imovel_ori: '',
  imovel_coord_lat: '',
  imovel_coord_lon: '',
  imovel_construtora: '',
  imovel_construtora_cnpj: '',
  imovel_finalidade: '',
  area_coberta_padrao: '',
  area_permeavel: '',
  area_acessoria_coberta: '',
  area_terreno: '',
  valor_terreno: '',
  destinacao_imovel: '',
  sistema_construtivo: '',
  sistema_construtivo_outros: '',
  num_datec: '',
  cobertura_tipo: '',
  cobertura_tipo2: '',
  teto: '',
  pavtos: '',
  quartos: '',
  suites: '',
  salas: '',
  vagas: '',
  tipo_vagas: '',
  acabamento_paredes_ext: '',
  loucas_metais: '',
  area_servico: '',
  cozinha: '',
  agua_quente: '',
  acabamento_paredes_int: '',
  paredes_areas_secas: '',
  calefacao: '',
  sustentabilidade: '',
  implantacao: '',
  revest_paredes_molhadas: '',
  revest_piso_secas: '',
  revest_piso_molhadas: '',
  divisao_interna: '',
  esquadrias_ext: '',
  esquadrias_int: '',
  abastecimento_agua: '',
  outros_acabamento: '',
  drenagem: '',
  coleta_esgoto: '',
  ger_energia: '',
  doc_certidao: '',
  doc_alvara: '',
  doc_alvara_data: '',
  doc_art_proj: '',
  doc_art_proj_num: '',
  doc_art_exec: '',
  doc_art_exec_num: '',
  doc_proj_legal: '',
  terreno_proprio: '',
  custos: new Array(20).fill(0),
  bdi_pct: 0,
  executor_obra: '',
  servicos_adicionais: Array.from({ length: 10 }, () => ({ nome: '', custo: 0 })),
  cronograma_pct: new Array(27).fill(0), // PréExc + 1..26
  infra: {},
  descricao_obras_executadas: '',
  observacoes: '',
  local_data: '',
};
