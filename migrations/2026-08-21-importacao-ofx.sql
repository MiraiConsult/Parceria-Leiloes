-- Importação de extrato OFX: guarda a origem bancária do lançamento.
--
-- Rodar no SQL Editor do Supabase (projeto lyllmxolrvvytibofqmp).
-- É aditivo: colunas novas, nulas para tudo que já existe. Sem esta migration
-- a importação continua funcionando, só perde duas coisas:
--   * a trava que impede reimportar o mesmo extrato duas vezes;
--   * o aprendizado — a próxima importação não reconhece o texto do banco
--     que já foi classificado antes.

alter table public.lancamentos
  add column if not exists ofx_fitid text,
  add column if not exists ofx_memo  text;

comment on column public.lancamentos.ofx_fitid is
  'FITID da transação no extrato OFX de origem. Único por conta bancária.';
comment on column public.lancamentos.ofx_memo is
  'Texto original (MEMO) da transação no extrato, usado para sugerir a rubrica em importações futuras.';

-- O FITID é único dentro de uma conta, não entre bancos diferentes.
create unique index if not exists lancamentos_ofx_fitid_banco_idx
  on public.lancamentos (banco_id, ofx_fitid)
  where ofx_fitid is not null;

-- A sugestão consulta o histórico por este texto a cada importação.
create index if not exists lancamentos_ofx_memo_idx
  on public.lancamentos (ofx_memo)
  where ofx_memo is not null;
