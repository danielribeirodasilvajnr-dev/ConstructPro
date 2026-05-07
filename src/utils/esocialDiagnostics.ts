export interface ESocialDiagnostic {
  codigo: string | number;
  regra?: string;
  evento?: string;
  descricao: string;
  causas: string[];
  solucao: string[];
  nivel: 'CRITICO' | 'ALERTA' | 'INFO';
  tipo: 'SEQUENCIA' | 'TABELA' | 'GOVERNO' | 'XML' | 'SCHEMA' | 'CADASTRO' | 'DESCONHECIDO';
  temporario: boolean;
  dependencias?: string[];
  xmlPath?: string;
  bloqueiaTransmissao: boolean;
}

export const ESOCIAL_ERRORS: Record<string, Partial<ESocialDiagnostic>> = {
  '180': {
    descricao: 'Contrato/Vínculo não encontrado.',
    causas: ['S-2200 ou S-2300 não enviado', 'Vínculo inexistente', 'Matrícula inválida', 'Trabalhador não sincronizado'],
    solucao: ['Verificar envio do cadastro inicial (S-2200/S-2300)', 'Validar a matrícula informada', 'Retransmitir o evento de admissão'],
    tipo: 'SEQUENCIA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '269': {
    descricao: 'Rubrica não encontrada no RET.',
    causas: ['S-1010 ausente', 'Vigência inválida', 'Rubrica não sincronizada'],
    solucao: ['Transmitir o evento S-1010 referente à rubrica', 'Validar a data de vigência'],
    tipo: 'TABELA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '301': {
    descricao: 'Erro interno eSocial.',
    causas: ['Indisponibilidade temporária nos servidores do Governo'],
    solucao: ['Aguardar alguns minutos', 'Retransmitir posteriormente'],
    tipo: 'GOVERNO',
    nivel: 'ALERTA',
    bloqueiaTransmissao: false,
    temporario: true
  },
  '401': {
    descricao: 'Conteúdo do evento inválido / Duplicidade.',
    causas: ['Evento já enviado anteriormente (Duplicidade)', 'Dados informados não condizem com o histórico do eSocial', 'XML malformado ou fora do padrão'],
    solucao: ['Se for duplicidade, o evento já foi aceito e você pode usar o número do recibo existente', 'Verificar se os dados do trabalhador (CPF, Matrícula) estão corretos', 'Revisar o preenchimento dos campos'],
    tipo: 'GOVERNO',
    nivel: 'ALERTA',
    bloqueiaTransmissao: false,
    temporario: false
  },
  '402': {
    descricao: 'Schema XML inválido.',
    causas: ['XML fora do XSD', 'Tag obrigatória ausente', 'Tipo de dado inválido', 'Campo incompatível'],
    solucao: ['Revisar o preenchimento de todos os campos obrigatórios', 'Validar a versão do leiaute (S-1.2)'],
    tipo: 'SCHEMA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '403': {
    descricao: 'Leiaute inválido.',
    causas: ['Versão incompatível', 'Namespace incorreto'],
    solucao: ['Atualizar a versão do leiaute no servidor'],
    tipo: 'SCHEMA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '404': {
    descricao: 'Certificado digital inválido.',
    causas: ['Certificado vencido', 'Assinatura inválida', 'Senha incorreta'],
    solucao: ['Verificar a validade do certificado A1', 'Reenviar o arquivo .pfx e atualizar a senha na configuração'],
    tipo: 'CADASTRO',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '533': {
    descricao: 'Erro nas verbas rescisórias.',
    causas: ['Divergência de valores no desligamento'],
    solucao: ['Revisar os valores das rubricas informadas no evento'],
    tipo: 'TABELA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '536': {
    descricao: 'Evento não encontrado.',
    causas: ['Tentativa de retificar ou excluir um evento que não existe na base do governo'],
    solucao: ['Verificar o número do recibo original', 'Consultar o eSocial web para confirmar a existência do evento'],
    tipo: 'SEQUENCIA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '553': {
    descricao: 'Informações incompatíveis.',
    causas: ['Conflito de dados entre os campos preenchidos'],
    solucao: ['Revisar os dados informados para garantir consistência'],
    tipo: 'CADASTRO',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  '602': {
    descricao: 'Falha integração TOM.',
    causas: ['Erro interno de processamento no SERPRO/eSocial'],
    solucao: ['Aguardar alguns minutos', 'Retransmitir o evento (erro temporário do governo)'],
    tipo: 'GOVERNO',
    nivel: 'ALERTA',
    bloqueiaTransmissao: false,
    temporario: true
  },
  '727': {
    descricao: 'Remuneração não encontrada.',
    causas: ['S-1200 não enviado ou rejeitado'],
    solucao: ['Transmitir com sucesso o evento de Remuneração (S-1200) antes de enviar o Pagamento (S-1210)'],
    tipo: 'SEQUENCIA',
    nivel: 'CRITICO',
    dependencias: ['S-1200'],
    bloqueiaTransmissao: true,
    temporario: false
  },
  '989': {
    descricao: 'Não é possível retificar evento.',
    causas: ['O evento já possui eventos dependentes vinculados (ex: pagamento já efetuado)'],
    solucao: ['Excluir os eventos dependentes (ex: S-1210) antes de retificar este evento'],
    tipo: 'SEQUENCIA',
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  }
};

export const ESOCIAL_REGRAS: Record<string, Partial<ESocialDiagnostic>> = {
  'REGRA_VALIDA_CPF': {
    tipo: 'CADASTRO',
    descricao: 'CPF inválido ou divergente na Receita Federal.',
    causas: ['Nome incorreto', 'Data de nascimento divergente', 'CPF suspenso na Receita'],
    solucao: ['Confirmar os dados do trabalhador no portal da Receita Federal', 'Atualizar o cadastro no AevumPro'],
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  'REGRA_EXISTE_VINCULO': {
    tipo: 'SEQUENCIA',
    descricao: 'Vínculo inexistente para o trabalhador.',
    causas: ['O evento S-2300 não foi aceito ou processado'],
    solucao: ['Transmitir e aguardar o sucesso do evento S-2300'],
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  'REGRA_EVENTO_EXTEMP': {
    tipo: 'SEQUENCIA',
    descricao: 'Evento fora do prazo permitido.',
    causas: ['Tentativa de envio de evento fora do fechamento da competência'],
    solucao: ['Verificar se a folha já foi fechada', 'Reabrir a folha se necessário (S-1298)'],
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  'REGRA_DEMONSTRATIVO': {
    tipo: 'CADASTRO',
    descricao: 'Identificador de demonstrativo (ideDmDev) divergente.',
    causas: ['O S-1210 está referenciando um ideDmDev que não existe no S-1200'],
    solucao: ['Garantir que os recibos de pagamento estão perfeitamente alinhados com as remunerações'],
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  'REGRA_DESLIGAMENTO': {
    tipo: 'SEQUENCIA',
    descricao: 'Erro no desligamento/término.',
    causas: ['Trabalhador já desligado', 'Data de término inconsistente'],
    solucao: ['Revisar a data de término', 'Consultar o portal web para confirmar o status do trabalhador'],
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  },
  'REGRA_TABGERAL_ALTERACAO_PERIODO_CONFLITANTE': {
    tipo: 'CADASTRO',
    descricao: 'Conflito de vigência na tabela.',
    causas: ['Já existe um evento com o mesmo período de validade'],
    solucao: ['Alterar o período de validade ou enviar como retificação em vez de novo envio'],
    nivel: 'CRITICO',
    bloqueiaTransmissao: true,
    temporario: false
  }
};

export function diagnoseESocialError(respostaGoverno: any, eventoTipo?: string): ESocialDiagnostic {
  const diagnostic: ESocialDiagnostic = {
    codigo: '',
    regra: '',
    evento: eventoTipo || '',
    descricao: 'Erro não mapeado ou desconhecido.',
    causas: ['Causa não identificada pelo motor de diagnóstico.'],
    solucao: ['Analisar a mensagem do governo detalhadamente.', 'Consultar o manual de orientação do eSocial.'],
    nivel: 'ALERTA',
    tipo: 'DESCONHECIDO',
    temporario: false,
    bloqueiaTransmissao: true
  };

  if (!respostaGoverno) return diagnostic;

  let msg = '';
  let codigo = '';

  if (Array.isArray(respostaGoverno) && respostaGoverno.length > 0) {
    // Se for um array de ocorrências (novo padrão do proxy)
    const principal = respostaGoverno[0];
    msg = principal.descricao || '';
    codigo = principal.codigo?.toString() || '';
  } else {
    // Fallback para objeto único (padrão antigo)
    msg = (respostaGoverno.ocorre_mensagem || respostaGoverno.message || respostaGoverno.envio_mensagem || '').toString();
    codigo = respostaGoverno.ocorre_codigo?.toString() || respostaGoverno.envio_codigo?.toString() || '';
  }
  
  diagnostic.codigo = codigo || 'N/A';

  // 1. Prioridade 1: Código Numérico
  if (codigo && ESOCIAL_ERRORS[codigo]) {
    Object.assign(diagnostic, ESOCIAL_ERRORS[codigo]);
  }

  // 2. Prioridade 2: REGRA_*
  let regraMatch = msg.match(/(REGRA_[A-Z_]+)/);
  if (regraMatch && ESOCIAL_REGRAS[regraMatch[1]]) {
    diagnostic.regra = regraMatch[1];
    Object.assign(diagnostic, ESOCIAL_REGRAS[regraMatch[1]]);
  }

  // 3. Prioridade 3: Descrição textual (heurística se não encontrou código claro)
  if (diagnostic.tipo === 'DESCONHECIDO') {
    if (msg.toLowerCase().includes('schema') || msg.toLowerCase().includes('cvc-')) {
      Object.assign(diagnostic, ESOCIAL_ERRORS['402']);
    } else if (msg.toLowerCase().includes('cpf')) {
      Object.assign(diagnostic, ESOCIAL_REGRAS['REGRA_VALIDA_CPF']);
    } else if (msg.toLowerCase().includes('rubrica')) {
      Object.assign(diagnostic, ESOCIAL_ERRORS['269']);
    } else if (msg.toLowerCase().includes('assinatura') || msg.toLowerCase().includes('certificado')) {
      Object.assign(diagnostic, ESOCIAL_ERRORS['404']);
    } else if (msg.toLowerCase().includes('lote inconsistente')) {
      Object.assign(diagnostic, ESOCIAL_ERRORS['401']);
    } else {
      diagnostic.descricao = msg;
    }
  }

  // Define dependência obrigatória se não declarada
  if (diagnostic.tipo === 'SEQUENCIA' && !diagnostic.dependencias) {
    if (eventoTipo === 'S-2399' || eventoTipo === 'S-1200') {
      diagnostic.dependencias = ['S-2300'];
    }
  }

  return diagnostic;
}
