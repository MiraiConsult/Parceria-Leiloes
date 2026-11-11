-- Fila de classificação: a despesa que entra pelo extrato vai para quem
-- classifica, não para quem importou.
--
-- Rodar no SQL Editor do Supabase (projeto lyllmxolrvvytibofqmp).
-- É aditivo: colunas novas, nulas para tudo que já existe.
--
-- Quem importa o extrato é a Lívia, e hoje o lançamento nasce no nome dela.
-- Como o colaborador só enxerga o que ele mesmo criou, a despesa importada
-- ficava invisível para a Marília — que é justamente quem sabe dizer a rubrica
-- e o centro de custo de cada conta. `classificar_por` é esse encaminhamento:
-- enquanto estiver preenchido, a despesa aparece na fila dessa pessoa; ao ser
-- classificada, o campo é limpo e o lançamento segue pendente para a aprovação
-- de quem confere.

alter table public.lancamentos
  add column if not exists classificar_por  uuid references public.users(id),
  add column if not exists classificado_em  timestamptz;

comment on column public.lancamentos.classificar_por is
  'Quem precisa classificar a rubrica e o centro de custo deste lançamento. Preenchido pela importação de OFX nas despesas; limpo quando a pessoa salva a classificação.';
comment on column public.lancamentos.classificado_em is
  'Quando a classificação foi feita. Serve para medir o que ficou parado na fila.';

-- A fila é consultada toda vez que a tela carrega.
create index if not exists lancamentos_classificar_por_idx
  on public.lancamentos (classificar_por)
  where classificar_por is not null;
