---
name: "Gerar Feedback Acionável"
order: 2
input:
  description: "Scorecard completo da task score-content.md com pontuações e justificativas"
output:
  description: "Lista de feedbacks acionáveis classificados como bloqueante/não-bloqueante com sugestões concretas e top 3 melhorias priorizadas"
---

# Gerar Feedback Acionável

## Objetivo

Transformar o scorecard em feedback prático e acionável para o criador de conteúdo. Cada ponto de melhoria deve ter classificação de prioridade, sugestão concreta e impacto esperado. O criador deve conseguir implementar as melhorias sem ambiguidade.

## Processo

1. **Analisar scorecard** — Identificar critérios com score <= 3 (prioridade) e scores 4 com potencial de subir
2. **Gerar feedback por critério** — Para cada critério abaixo de 5, escrever feedback específico
3. **Classificar prioridade** — BLOQUEANTE (score <= 2 ou impacta veredito) ou NÃO-BLOQUEANTE (melhoria recomendada)
4. **Criar sugestão concreta** — Para cada feedback, escrever exatamente o que fazer diferente
5. **Estimar impacto** — Indicar o efeito esperado da melhoria no engajamento
6. **Priorizar top 3** — Selecionar as 3 melhorias de maior impacto para implementar primeiro

## Formato de Saída

```yaml
feedback:
  content_id: "Identificador da peça"
  verdict: "APROVADO | REJEITADO"
  total_feedbacks: 5
  blocking_count: 1
  non_blocking_count: 4

  items:
    - criterion: "CTA"
      score: 3
      priority: "BLOQUEANTE | NÃO-BLOQUEANTE"
      problem: "Descrição específica do problema encontrado"
      suggestion: "Sugestão concreta e implementável"
      example: "Exemplo prático de como ficaria corrigido"
      expected_impact: "Impacto esperado na métrica de engajamento"

  top_3_improvements:
    - rank: 1
      criterion: "CTA"
      action: "Ação resumida em 1 linha"
      impact: "Alto | Médio | Baixo"
    - rank: 2
      criterion: "..."
      action: "..."
      impact: "..."
    - rank: 3
      criterion: "..."
      action: "..."
      impact: "..."

  strengths:
    - "Ponto forte 1 com reconhecimento específico"
    - "Ponto forte 2"

  overall_note: "Comentário geral de 2-3 linhas sobre a qualidade do conteúdo e próximos passos"
```

## Exemplo de Saída

```yaml
feedback:
  content_id: "ig-carousel-reputacao-receita"
  verdict: "APROVADO"
  total_feedbacks: 4
  blocking_count: 0
  non_blocking_count: 4

  items:
    - criterion: "CTA"
      score: 3
      priority: "NÃO-BLOQUEANTE"
      problem: "'Salva e compartilha' é genérico e não diferencia de milhares de outros posts."
      suggestion: "Trocar por CTA que envolva ação específica relacionada ao conteúdo."
      example: "Marca aquele sócio que precisa ver o dado do slide 3 👇"
      expected_impact: "+15-20% em comentários vs CTA genérico"

    - criterion: "Clareza"
      score: 4
      priority: "NÃO-BLOQUEANTE"
      problem: "Slide 5 mistura duas ideias: importância de responder avaliações E pedir feedback ativo."
      suggestion: "Dividir em dois slides: slide 5 sobre responder avaliações, slide 6 sobre feedback ativo."
      example: "Slide 5: 'Responda TODA avaliação. Positiva ou negativa.' / Slide 6: 'Não espere o cliente avaliar. Peça ativamente.'"
      expected_impact: "Melhora retenção no meio do carrossel e reduz drop-off"

  top_3_improvements:
    - rank: 1
      criterion: "CTA"
      action: "Substituir CTA genérico por ação específica com menção"
      impact: "Alto"
    - rank: 2
      criterion: "Clareza"
      action: "Dividir slide 5 em dois slides com uma ideia cada"
      impact: "Médio"
    - rank: 3
      criterion: "Platform Optimization"
      action: "Adicionar alt-text descritivo em cada slide"
      impact: "Médio"

  strengths:
    - "Hook excepcional — '47% mais vendas' é dado de impacto que interrompe scroll"
    - "Brand voice consistente com tom HelloGrowth do primeiro ao último slide"
    - "Dados verificáveis com fonte e metodologia clara (McKinsey, 500 empresas)"

  overall_note: "Conteúdo de alta qualidade com storytelling forte e dados sólidos. As melhorias sugeridas são refinamentos que podem elevar o engajamento, mas a peça já está pronta para publicação. Priorize a troca do CTA para maximizar comentários."
```

## Critérios de Qualidade

1. Todo critério com score < 5 tem feedback (mesmo que não-bloqueante)
2. Feedbacks bloqueantes são genuinamente bloqueantes (impactam qualidade mínima)
3. Cada sugestão é concreta o suficiente para implementar sem dúvidas
4. Exemplos são realistas e alinhados com o contexto do conteúdo
5. Top 3 melhorias são as de maior impacto real (não arbitrárias)
6. Pontos fortes são reconhecidos com especificidade

## Condições de Veto

- **REJEITAR** se feedback não tiver sugestão acionável
- **REJEITAR** se classificação bloqueante/não-bloqueante for inconsistente com score
- **REFAZER** se sugestões forem vagas (ex: "melhore o CTA" sem dizer como)
- **REFAZER** se nenhum ponto forte for reconhecido (mesmo em conteúdo rejeitado)
