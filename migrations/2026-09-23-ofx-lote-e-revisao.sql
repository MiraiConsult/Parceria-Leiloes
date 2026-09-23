-- Rastro da importação de OFX: de qual arquivo veio o lançamento e se a
-- rubrica ainda precisa de conferência.
--
-- Rodar no SQL Editor do Supabase (projeto lyllmxolrvvytibofqmp).
-- É aditivo: colunas novas, nulas para tudo que já existe.
--
-- O que resolve: o lançamento importado entra conciliado (o extrato prova que
-- o dinheiro passou) e pendente (ninguém conferiu a rubrica ainda). Sem estas
-- colunas não dá para separar, na tela de Lançamentos, o que subiu de arquivo
-- do que foi digitado, nem saber quais rubricas a importação chutou.

alter table public.lancamentos
  add column if not exists ofx_arquivo     text,
  add column if not exists ofx_importado_em timestamptz,
  add column if not exists ofx_revisar     boolean,
  add column if not exists ofx_motivo      text;

comment on column public.lancamentos.ofx_arquivo is
  'Nome do arquivo OFX de onde este lançamento veio.';
comment on column public.lancamentos.ofx_importado_em is
  'Momento da importação. Junto com ofx_arquivo, identifica o lote para filtrar na tela.';
comment on column public.lancamentos.ofx_revisar is
  'true quando a rubrica veio de sugestão sem certeza — alguém precisa conferir e, se for o caso, repartir.';
comment on column public.lancamentos.ofx_motivo is
  'Por que a importação escolheu essa rubrica (o mesmo texto mostrado na tela de revisão).';

-- A tela filtra por lote e pela fila de conferência.
create index if not exists lancamentos_ofx_lote_idx
  on public.lancamentos (ofx_importado_em desc)
  where ofx_importado_em is not null;

create index if not exists lancamentos_ofx_revisar_idx
  on public.lancamentos (ofx_revisar)
  where ofx_revisar;
