---
name: "Otimizar Post LinkedIn"
order: 2
input:
  description: "Post LinkedIn completo (texto e/ou carrossel-documento) criado na task anterior"
output:
  description: "Versão otimizada com melhorias de hook, estrutura, hashtags e estratégia de publicação"
---

# Otimizar Post LinkedIn

## Objetivo

Revisar e otimizar o post LinkedIn para maximizar alcance, comentários e dwell time. Aplicar checklist de otimização baseado no comportamento atual do algoritmo do LinkedIn.

## Processo

1. **Auditar hook** — Verificar se os primeiros 210 caracteres são irresistíveis e geram clique em "ver mais"
2. **Verificar estrutura mobile** — Confirmar que nenhum parágrafo excede 2 linhas no mobile
3. **Avaliar storytelling** — Verificar se há arco narrativo (não apenas lista de pontos)
4. **Checar dado âncora** — Confirmar presença de número/pesquisa verificável
5. **Otimizar CTA** — Garantir que a pergunta final é aberta e gera debate (não sim/não)
6. **Refinar hashtags** — Validar relevância e quantidade (3-5)
7. **Estratégia de publicação** — Definir horário, primeiro comentário e plano de engajamento

## Checklist de Otimização

```yaml
linkedin_optimization:
  hook_audit:
    - item: "Hook tem max 210 caracteres?"
      status: "pass | fail"
      current_count: 0
      fix: ""
    - item: "Hook gera curiosidade ou emoção?"
      status: "pass | fail"
      fix: ""
    - item: "Hook evita clichês (Bom dia rede, etc)?"
      status: "pass | fail"
      fix: ""

  structure_audit:
    - item: "Parágrafos com max 2 linhas?"
      status: "pass | fail"
      fix: ""
    - item: "Espaçamento entre parágrafos?"
      status: "pass | fail"
      fix: ""
    - item: "Extensão adequada (100-300 palavras)?"
      status: "pass | fail"
      current_count: 0
      fix: ""

  engagement_audit:
    - item: "CTA gera comentário (não apenas like)?"
      status: "pass | fail"
      fix: ""
    - item: "Pergunta é aberta (não sim/não)?"
      status: "pass | fail"
      fix: ""
    - item: "Conteúdo é 'comentável' — gera opinião?"
      status: "pass | fail"
      fix: ""

  algorithm_audit:
    - item: "Zero links no corpo do post?"
      status: "pass | fail"
      fix: ""
    - item: "3-5 hashtags relevantes?"
      status: "pass | fail"
      fix: ""
    - item: "Primeiro comentário preparado?"
      status: "pass | fail"
      fix: ""

  brand_audit:
    - item: "Tom HelloGrowth (autoridade + acessibilidade)?"
      status: "pass | fail"
      fix: ""
    - item: "Sem linguagem corporativa vazia?"
      status: "pass | fail"
      fix: ""
```

## Formato de Saída Complementar

```yaml
publication_strategy:
  best_time: "Terça 08:00 ou Quinta 12:00"
  reasoning: "Alto volume de profissionais online no horário comercial"
  first_comment_timing: "Imediato — publicar junto com o post"
  first_comment_text: "Texto do primeiro comentário com link e contexto"
  engagement_plan:
    first_hour: "Responder todos os comentários com perguntas de follow-up"
    first_day: "Reagir a cada comentário e criar micro-conversas"
    boost_tactic: "Marcar 2-3 pessoas relevantes no primeiro comentário (não no post)"
  expected_metrics:
    engagement_rate: "4-6% (benchmark para post de texto com storytelling)"
    comments_target: "15-30 comentários orgânicos"
    impressions_estimate: "2x-5x o número de conexões"
```

## Critérios de Qualidade

1. Todos os itens do checklist foram avaliados
2. Cada "fail" tem sugestão de correção específica e acionável
3. Estratégia de publicação é realista e justificada
4. Otimizações melhoram sem descaracterizar o post original
5. Primeiro comentário agrega valor real (não é spam)

## Condições de Veto

- **REJEITAR** se mais de 4 itens falharem sem correção proposta
- **REFAZER** se otimizações alterarem a narrativa ou tom do post
- **REFAZER** se estratégia de publicação for genérica (sem horários específicos)
