-- As 28 rubricas 4xxx (Não Operacionais, Distribuição de Lucros, Imobilizado e
-- Contas Transitórias) estavam como DESPESA_FIXA no banco, embora o cadastro
-- original (services/mockData.ts) as trate como NAO_OPERACIONAL. Com isso, o
-- Resgate dos Investimentos (tipo receita) abatia as despesas: em 02/2026 a
-- seção mostrava +R$ 1.921,36 em vez de −R$ 96.948,42.
--
-- Só muda a seção do DRE: o Resultado Líquido, o Fluxo de Caixa e os
-- lançamentos não mudam. Para desfazer: troque os dois valores de lugar.
update public.categorias
   set classificacao = 'NAO_OPERACIONAL'
 where codigo like '4%'
   and classificacao = 'DESPESA_FIXA';
