---
name: "Pontuar Conteúdo"
order: 1
input:
  description: "Peça de conteúdo completa (carrossel, reel, stories ou post LinkedIn) com todos os elementos"
output:
  description: "Scorecard completo com pontuação em 8 critérios, score ponderado e veredito final"
---

# Pontuar Conteúdo

## Objetivo

Avaliar cada peça de conteúdo nos 8 critérios de qualidade da HelloGrowth, aplicando pesos e calculando o score ponderado final. Emitir veredito de APROVADO ou REJEITADO com base nos thresholds definidos.

## Processo

1. **Identificar a plataforma** — Determinar se é Instagram (carrossel, reel, stories) ou LinkedIn (post, carrossel-documento)
2. **Carregar régua da plataforma** — Aplicar os padrões específicos (ex: 125 chars para IG hook, 210 chars para LinkedIn hook)
3. **Avaliar cada critério** — Pontuar de 1 a 5 com justificativa específica de 1-2 linhas
4. **Aplicar pesos** — Multiplicar cada score pelo peso do critério
5. **Calcular média ponderada** — Soma dos scores ponderados / soma dos pesos
6. **Verificar deal-breakers** — Checar se algum critério tem score < 2
7. **Emitir veredito** — APROVADO (>= 3.5 e nenhum < 2) ou REJEITADO

## Formato de Saída

```yaml
scorecard:
  content_id: "Identificador da peça"
  content_type: "carousel | reel | stories | linkedin_post | linkedin_carousel"
  platform: "instagram | linkedin"

  scores:
    hook:
      score: 5
      weight: 1.5
      weighted: 7.5
      justification: "Dado impactante (47%) como abertura — gera curiosidade imediata"

    clarity:
      score: 4
      weight: 1.0
      weighted: 4.0
      justification: "Mensagem clara na maioria dos slides. Slide 5 tem duas ideias concorrentes."

    cta:
      score: 3
      weight: 1.2
      weighted: 3.6
      justification: "'Salva e compartilha' é genérico. Falta especificidade."

    brand_voice:
      score: 5
      weight: 1.3
      weighted: 6.5
      justification: "Tom de autoridade acessível alinhado com HelloGrowth."

    platform_optimization:
      score: 4
      weight: 1.2
      weighted: 4.8
      justification: "Word count dentro do range. Falta alt-text para acessibilidade."

    visual_quality:
      score: 4
      weight: 0.8
      weighted: 3.2
      justification: "Indicações visuais claras para a maioria dos slides."

    originality:
      score: 4
      weight: 1.0
      weighted: 4.0
      justification: "Ângulo FOMO competitivo é diferenciado no nicho."

    accuracy:
      score: 5
      weight: 1.0
      weighted: 5.0
      justification: "Dado McKinsey com fonte, data e metodologia verificáveis."

  summary:
    total_weighted: 38.6
    total_weight: 9.0
    average: 4.29
    deal_breaker: false
    verdict: "APROVADO"
    highlights:
      - "Hook excepcional com dado de impacto"
      - "Brand voice consistente do início ao fim"
    concerns:
      - "CTA precisa ser mais específico"
      - "Slide 5 pode ser dividido em dois"
```

## Escala de Pontuação

| Score | Classificação | Descrição |
|-------|--------------|-----------|
| 5 | Excelente | Supera expectativas. Referência de qualidade. |
| 4 | Bom | Atende padrões com qualidade. Pequenos ajustes opcionais. |
| 3 | Adequado | Funcional mas com espaço claro para melhoria. |
| 2 | Fraco | Abaixo do padrão mínimo. Requer revisão obrigatória. |
| 1 | Inaceitável | Falha fundamental. Requer reescrita completa. |

## Critérios de Qualidade

1. Todos os 8 critérios pontuados com justificativa de 1-2 linhas
2. Pesos aplicados corretamente (Hook 1.5x, CTA 1.2x, Brand Voice 1.3x, Platform 1.2x, Visual 0.8x, demais 1.0x)
3. Média ponderada calculada corretamente
4. Deal-breaker identificado se qualquer critério < 2
5. Veredito coerente com score e regras de deal-breaker
6. Highlights e concerns são específicos (não genéricos)

## Condições de Veto

- **REJEITAR avaliação** se algum critério não tiver justificativa
- **REJEITAR avaliação** se cálculo de média estiver incorreto
- **REFAZER** se justificativas forem genéricas (ex: "bom hook")
- **REFAZER** se a régua da plataforma errada for aplicada
