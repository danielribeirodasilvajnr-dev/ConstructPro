import * as XLSX from 'xlsx';

self.onmessage = (e: MessageEvent) => {
  const { data, mode, sinapiType, sinapiState, userId } = e.data;
  
  try {
    // A leitura do buffer é a operação que mais custa CPU
    const workbook = XLSX.read(data, { type: 'array' });
    const normalizeStr = (s: any) => String(s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const parseVal = (val: any) => {
      if (val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return val;
      let str = String(val).replace(/R\$/g, '').trim();
      if (str.includes('.') && str.includes(',')) {
        if (str.indexOf(',') > str.indexOf('.')) str = str.replace(/\./g, '').replace(',', '.');
        else str = str.replace(/,/g, '');
      } else if (str.includes(',')) {
        str = str.replace(',', '.');
      }
      return parseFloat(str) || 0;
    };

    if (mode === 'sinapi') {
      let worksheet = workbook.Sheets[sinapiType];
      if (!worksheet) {
        const foundSheetName = workbook.SheetNames.find(n => n.toUpperCase().includes(sinapiType));
        if (foundSheetName) worksheet = workbook.Sheets[foundSheetName];
      }

      if (!worksheet) {
        self.postMessage({ error: `Não foi possível encontrar a aba "${sinapiType}" na planilha SINAPI anexada. Abas disponíveis: ${workbook.SheetNames.join(', ')}` });
        return;
      }

      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      let stateRowIndex = -1;
      let headerRowIndex = -1;
      let stateColIndex = -1;
      let colMap = { code: -1, desc: -1, unit: -1 };

      for (let i = 0; i < rows.length && i < 30; i++) {
        const row = rows[i].map(c => String(c).trim().toUpperCase());
        if (row.includes('AC') && row.includes('SP') && row.includes('RJ')) {
          stateRowIndex = i;
          stateColIndex = row.indexOf(sinapiState);
          break;
        }
      }

      if (stateRowIndex === -1 || stateColIndex === -1) {
        self.postMessage({ error: `Não foi possível localizar a linha com a sigla dos Estados na aba ${sinapiType}, ou o estado ${sinapiState} não foi encontrado.` });
        return;
      }

      for (let i = stateRowIndex; i < rows.length && i < stateRowIndex + 10; i++) {
        const rowStr = rows[i].map(normalizeStr).join(' ');
        if (rowStr.includes('descri') && (rowStr.includes('codigo') || rowStr.includes('cod'))) {
          headerRowIndex = i;
          rows[i].forEach((colName, index) => {
            const lower = normalizeStr(colName);
            if (lower.includes('codigo') || lower === 'cod') colMap.code = index;
            if (lower.includes('descri')) colMap.desc = index;
            if (lower.includes('unid') || lower === 'un') colMap.unit = index;
          });
          break;
        }
      }

      if (headerRowIndex === -1 || colMap.desc === -1) {
        self.postMessage({ error: `Encontramos o Estado, mas não achamos o cabeçalho da tabela (Código, Descrição) na aba ${sinapiType}.` });
        return;
      }

      const itemsToInsert = [];
      const now = new Date().toISOString();

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const desc = String(row[colMap.desc] || '').trim();
        if (!desc) continue;

        const price = parseVal(row[stateColIndex]);

        itemsToInsert.push({
          user_id: userId,
          code: String(row[colMap.code] || '').substring(0, 50),
          description: desc.substring(0, 255),
          unit: String(row[colMap.unit] || 'un').substring(0, 10),
          material_cost: 0,
          labor_cost: price,
          equipment_cost: 0,
          third_party_cost: 0,
          created_at: now,
          updated_at: now
        });
      }

      if (itemsToInsert.length === 0) {
        self.postMessage({ error: `Nenhum item válido encontrado na aba ${sinapiType} para o estado ${sinapiState}.` });
        return;
      }

      self.postMessage({ success: true, itemsToInsert });
    } else {
      // GENERIC IMPORT
      let headerRowIndex = -1;
      let rows: any[][] = [];
      let colMap = { code: -1, desc: -1, unit: -1, mat: -1, lab: -1, eqp: -1, third: -1, mediano: -1 };

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        for (let i = 0; i < sheetRows.length; i++) {
          const rowStr = sheetRows[i].map(normalizeStr).join(' ');
          
          if (rowStr.includes('descri') && (rowStr.includes('codigo') || rowStr.includes('cod') || rowStr.includes('item'))) {
            headerRowIndex = i;
            rows = sheetRows;
            
            sheetRows[i].forEach((colName, index) => {
              const lower = normalizeStr(colName);
              if (colMap.code === -1 && (lower.includes('codigo') || lower === 'cod' || lower.includes('item'))) colMap.code = index;
              else if (colMap.desc === -1 && lower.includes('descri')) colMap.desc = index;
              else if (colMap.unit === -1 && (lower.includes('unid') || lower === 'un')) colMap.unit = index;
              else if (colMap.mat === -1 && (lower.includes('material') || lower.includes('mat'))) colMap.mat = index;
              else if (colMap.lab === -1 && (lower.includes('mao de obra') || lower.includes('mo') || lower.includes('m.o') || lower.includes('labor'))) colMap.lab = index;
              else if (colMap.eqp === -1 && (lower.includes('equipamento') || lower.includes('eqp'))) colMap.eqp = index;
              else if (colMap.third === -1 && lower.includes('terceiro')) colMap.third = index;
              else if (colMap.mediano === -1 && (
                lower.includes('mediano') || lower.includes('total') || lower.includes('valor') || 
                (lower.includes('preco') && !lower.includes('origem')) || lower.includes('vlr') || 
                lower.includes('desonerado') || (lower.includes('custo') && !lower.includes('mat') && !lower.includes('mao') && !lower.includes('obra') && !lower.includes('eqp'))
              )) {
                 colMap.mediano = index;
              }
            });
            break;
          }
        }
        if (headerRowIndex !== -1) break;
      }

      if (headerRowIndex === -1 || colMap.desc === -1) {
        self.postMessage({ error: 'Não foi possível encontrar a tabela na planilha genérica! Verifique se existe uma aba com colunas de "Código" e "Descrição".' });
        return;
      }

      if (colMap.mat === -1 && colMap.mediano === -1) {
        const foundHeaders = rows[headerRowIndex].join(' | ');
        self.postMessage({ error: `Encontrei o cabeçalho, mas não achei a coluna de PREÇO!\nColunas encontradas:\n${foundHeaders}` });
        return;
      }

      const itemsToInsert = [];
      const now = new Date().toISOString();

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const desc = String(row[colMap.desc] || '').trim();
        if (!desc) continue;

        const mat = colMap.mat !== -1 ? parseVal(row[colMap.mat]) : 0;
        const lab = colMap.lab !== -1 ? parseVal(row[colMap.lab]) : 0;
        const eqp = colMap.eqp !== -1 ? parseVal(row[colMap.eqp]) : 0;
        const third = colMap.third !== -1 ? parseVal(row[colMap.third]) : 0;
        const mediano = colMap.mediano !== -1 ? parseVal(row[colMap.mediano]) : 0;

        itemsToInsert.push({
          user_id: userId,
          code: String(row[colMap.code] || '').substring(0, 50),
          description: desc.substring(0, 255),
          unit: String(row[colMap.unit] || 'un').substring(0, 10),
          material_cost: mat > 0 ? mat : mediano,
          labor_cost: lab,
          equipment_cost: eqp,
          third_party_cost: third,
          created_at: now,
          updated_at: now
        });
      }

      if (itemsToInsert.length === 0) {
        self.postMessage({ error: 'Nenhum item válido encontrado após o cabeçalho da tabela genérica.' });
        return;
      }

      self.postMessage({ success: true, itemsToInsert });
    }
  } catch (error: any) {
    self.postMessage({ error: error.message || 'Erro desconhecido ao processar planilha.' });
  }
};
