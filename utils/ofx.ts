// Leitura de extrato bancário em OFX.
//
// Cobre as duas gerações do formato: OFX 1.x (SGML, tags de folha sem
// fechamento) e OFX 2.x (XML). A leitura é a mesma nos dois casos porque o
// valor de uma folha sempre vai de '>' até o próximo '<' ou quebra de linha.

export interface TransacaoOfx {
  fitid: string;          // identificador único da transação no banco
  tipo: 'credito' | 'debito';
  data: string;           // YYYY-MM-DD (data do lançamento no banco)
  valor: number;          // em centavos, sempre positivo
  memo: string;           // texto original, como veio do banco
  // Extraído do memo:
  operacao: string;       // "RECEBIMENTO PIX", "TARIFA SERV.COBR.TITULOS", ...
  contraparte: string;    // nome de quem pagou/recebeu, normalizado
  documento: string;      // CPF/CNPJ só com dígitos, quando o banco informa
}

export interface ContaOfx {
  bancoCodigo: string;    // BANKID (748 = Sicredi)
  conta: string;          // ACCTID
  tipoConta: string;
  moeda: string;
  inicio: string;         // YYYY-MM-DD
  fim: string;            // YYYY-MM-DD
  saldo: number | null;   // LEDGERBAL em centavos
  saldoData: string;
  transacoes: TransacaoOfx[];
}

export interface ExtratoOfx {
  contas: ContaOfx[];
  totalTransacoes: number;
}

/** Lê o valor de uma tag de folha: `<TAG>valor` até '<' ou fim de linha. */
const tag = (bloco: string, nome: string): string => {
  const m = new RegExp(`<${nome}>([^<\r\n]*)`, 'i').exec(bloco);
  return m ? m[1].trim() : '';
};

/** `20260803000000[-3:GMT]` -> `2026-08-03`. */
const dataOfx = (bruta: string): string => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(bruta.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
};

/**
 * `-1.240,00` ou `-1240.00` -> -124000 centavos.
 * O separador decimal é o último ponto ou vírgula; o que vier antes é milhar.
 */
const centavos = (bruto: string): number => {
  const limpo = bruto.trim().replace(/\s/g, '');
  const ultimoSep = Math.max(limpo.lastIndexOf(','), limpo.lastIndexOf('.'));
  const semSep = ultimoSep === -1
    ? limpo.replace(/[.,]/g, '') + '00'
    : limpo.slice(0, ultimoSep).replace(/[.,]/g, '') + limpo.slice(ultimoSep + 1).padEnd(2, '0').slice(0, 2);
  const n = parseInt(semSep, 10);
  return isNaN(n) ? 0 : n;
};

// Tokens do memo que são ruído de sistema, não parte do nome de ninguém.
const RUIDO = /^(PIX_CRED?|PIX_DEB|PIX|TED|DOC|TRANSF|ID)$/;
// Referências internas do banco: CX809193, COB000001, DARFC0385, CLARSP11G.
const REFERENCIA = /^[A-Z_]{2,}\d{3,}[A-Z0-9]*$/;
const SO_NUMERO = /^[\d.\-/]+$/;

/** Tira acento e pontuação, deixa caixa alta — para comparar nomes. */
export const normalizarNome = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Separa o memo do banco em operação + contraparte + documento.
 *
 * "PAGAMENTO PIX-PIX_DEB   13635060000122 W. M. MACHADO JUNIOR & CIA. LTDA"
 *   -> { operacao: "PAGAMENTO PIX", documento: "13635060000122",
 *        contraparte: "W M MACHADO JUNIOR CIA LTDA" }
 *
 * Vale para o Sicredi, que põe o nome no MEMO. Bancos que não informam a
 * contraparte (Banrisul, por exemplo) devolvem contraparte vazia — e aí a
 * sugestão passa a depender de valor e histórico, não de texto.
 */
export const lerMemo = (memo: string): Pick<TransacaoOfx, 'operacao' | 'contraparte' | 'documento'> => {
  const corte = memo.indexOf('-');
  const operacao = corte > 0 ? memo.slice(0, corte).trim() : '';
  const resto = corte > 0 ? memo.slice(corte + 1) : memo;

  const doc = /\b(\d{11}|\d{14})\b/.exec(resto);

  const palavras: string[] = [];
  for (const t of resto.split(/\s+/)) {
    const limpo = t.trim();
    if (!limpo) continue;
    const comparavel = normalizarNome(limpo).replace(/\s/g, '_');
    if (SO_NUMERO.test(limpo) || RUIDO.test(comparavel) || REFERENCIA.test(comparavel)) continue;
    palavras.push(limpo);
  }

  // "VIVO 02558157000162 VIVO" vira "VIVO VIVO", e "VIVO RS-G ... VIVO RS-G"
  // vira "VIVO RS G VIVO RS G": o banco repete o convênio antes e depois do
  // CNPJ. Colapsa tanto a palavra repetida quanto a sequência inteira.
  const semRepeticao = palavras.filter((p, i) => normalizarNome(p) !== normalizarNome(palavras[i - 1] ?? ''));
  const partes = normalizarNome(semRepeticao.join(' ')).replace(/\bID\b\s*$/, '').trim().split(' ');
  const meio = partes.length / 2;
  const espelhado = partes.length > 1 && partes.length % 2 === 0
    && partes.slice(0, meio).join(' ') === partes.slice(meio).join(' ');
  const nome = (espelhado ? partes.slice(0, meio) : partes).join(' ');

  return { operacao, contraparte: nome, documento: doc ? doc[1] : '' };
};

/**
 * Decodifica o arquivo. O header anuncia o charset, mas nem sempre diz a
 * verdade (o Sicredi declara CHARSET:1252 e entrega UTF-8), então quem manda
 * é o conteúdo: tenta UTF-8 estrito e só cai para windows-1252 se falhar.
 */
export const decodificarOfx = (buffer: ArrayBuffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
};

/** Lê o conteúdo de um arquivo OFX. Lança Error com mensagem em português. */
export const lerOfx = (conteudo: string): ExtratoOfx => {
  if (!/<OFX>/i.test(conteudo)) {
    throw new Error('O arquivo não parece ser um OFX: não encontrei a marcação <OFX>.');
  }

  // Conta corrente (STMTRS) e cartão de crédito (CCSTMTRS) têm a mesma
  // estrutura de transações, mudando só o bloco que identifica a conta.
  const blocos = [
    ...conteudo.matchAll(/<STMTRS>([\s\S]*?)<\/STMTRS>/gi),
    ...conteudo.matchAll(/<CCSTMTRS>([\s\S]*?)<\/CCSTMTRS>/gi),
  ];

  const contas: ContaOfx[] = blocos.map(bloco => {
    const corpo = bloco[1];
    const lista = /<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/i.exec(corpo);
    const saldoBruto = tag(corpo, 'BALAMT');

    const transacoes: TransacaoOfx[] = [...(lista?.[1] ?? '').matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)]
      .map(t => {
        const b = t[1];
        const valor = centavos(tag(b, 'TRNAMT'));
        const memo = tag(b, 'MEMO') || tag(b, 'NAME');
        const trntype = tag(b, 'TRNTYPE').toUpperCase();
        // O sinal do valor manda; TRNTYPE é só desempate quando vem zerado.
        const credito = valor > 0 || (valor === 0 && trntype === 'CREDIT');
        return {
          fitid: tag(b, 'FITID'),
          tipo: credito ? 'credito' as const : 'debito' as const,
          data: dataOfx(tag(b, 'DTPOSTED')),
          valor: Math.abs(valor),
          memo,
          ...lerMemo(memo),
        };
      })
      .filter(t => t.data && t.valor > 0);

    return {
      bancoCodigo: tag(corpo, 'BANKID'),
      conta: tag(corpo, 'ACCTID'),
      tipoConta: tag(corpo, 'ACCTTYPE'),
      moeda: tag(corpo, 'CURDEF') || 'BRL',
      inicio: dataOfx(tag(corpo, 'DTSTART')),
      fim: dataOfx(tag(corpo, 'DTEND')),
      saldo: saldoBruto ? centavos(saldoBruto) : null,
      saldoData: dataOfx(tag(corpo, 'DTASOF')),
      transacoes,
    };
  });

  const totalTransacoes = contas.reduce((acc, c) => acc + c.transacoes.length, 0);
  if (totalTransacoes === 0) {
    throw new Error('O arquivo foi lido, mas não contém nenhuma transação (<STMTTRN>).');
  }

  return { contas, totalTransacoes };
};
