---
name: "Ranquear e Selecionar Top 5 Histórias"
order: 2
input:
  description: "Lista de 8-12 notícias coletadas na task find-news.md com metadados completos"
output:
  description: "Top 5 histórias ranqueadas por potencial de engajamento, com score e justificativa"
---

# Ranquear e Selecionar Top 5 Histórias

## Objetivo

Analisar as notícias coletadas e selecionar as 5 com maior potencial de engajamento nas redes sociais, aplicando critérios objetivos de ranqueamento.

## Processo

1. **Avaliar cada notícia** — Aplicar os 5 critérios de pontuação (abaixo) para cada notícia da lista
2. **Calcular score composto** — Somar os pontos de cada critério (escala 1-5 por critério, total máximo 25)
3. **Ordenar por score** — Classificar do maior para o menor score total
4. **Selecionar top 5** — Escolher as 5 notícias com maior pontuação
5. **Redigir justificativa** — Para cada selecionada, explicar em 1-2 linhas por que tem alto potencial

## Critérios de Pontuação (1-5 cada)

| Critério | Peso | Descrição |
|----------|------|-----------|
| Dados Concretos | 1.5x | Contém números, percentuais ou pesquisas citáveis |
| Relevância HelloGrowth | 1.5x | Conexão direta com negócios, reputação, confiança ou vendas |
| Potencial de Debate | 1.0x | Gera opinião dividida ou "quero comentar" |
| Novidade | 1.0x | Informação que o público provavelmente ainda não viu |
| Adaptabilidade Visual | 1.0x | Facilidade de transformar em carrossel, reel ou post visual |

## Formato de Saída

```yaml
ranked_stories:
  - rank: 1
    title: "Título da notícia"
    source: "Veículo"
    date: "YYYY-MM-DD"
    url: "https://url-completa.com"
    summary: "Resumo factual de 2-3 linhas"
    score:
      dados_concretos: 5
      relevancia_hellogrowth: 5
      potencial_debate: 4
      novidade: 4
      adaptabilidade_visual: 5
      total: 23.5
    justificativa: "Dado quantitativo forte (47%) + tema core da marca + fácil de virar carrossel com estatísticas"
    suggested_angles:
      - "Estatística impactante como gancho"
      - "Comparativo antes/depois"
      - "Checklist prático derivado"
```

## Exemplo de Saída

```yaml
ranked_stories:
  - rank: 1
    title: "Empresas com reputação digital forte vendem 47% mais online"
    source: "Valor Econômico"
    date: "2026-03-18"
    url: "https://valor.globo.com/empresas/reputacao-digital-vendas"
    summary: "Estudo da McKinsey revela correlação direta entre nota de reputação e vendas online."
    score:
      dados_concretos: 5
      relevancia_hellogrowth: 5
      potencial_debate: 4
      novidade: 4
      adaptabilidade_visual: 5
      total: 23.5
    justificativa: "Número de impacto (47%) + core da HelloGrowth + ideal para carrossel de dados"
    suggested_angles:
      - "O número que vai mudar sua estratégia digital"
      - "Reputação = Receita: os dados provam"
```

## Critérios de Qualidade

1. Exatamente 5 histórias no output final
2. Scores calculados corretamente com pesos aplicados
3. Justificativas específicas (não genéricas)
4. Ângulos sugeridos são distintos entre si
5. Top 5 cobre pelo menos 2 subtemas diferentes

## Condições de Veto

- **REJEITAR** se todas as 5 histórias forem do mesmo subtema
- **REJEITAR** se nenhuma história tiver score acima de 18
- **REFAZER** se os ângulos sugeridos forem genéricos demais (ex: "postar sobre isso")
- **REFAZER** se a justificativa não mencionar critérios específicos
