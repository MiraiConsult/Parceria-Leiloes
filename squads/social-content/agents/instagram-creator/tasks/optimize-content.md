---
name: "Otimizar Conteúdo Instagram"
order: 5
input:
  description: "Conteúdo completo de carrossel, reel e stories criados nas tasks anteriores"
output:
  description: "Versão otimizada de cada peça com melhorias em hashtags, legendas, CTAs e horários sugeridos"
---

# Otimizar Conteúdo Instagram

## Objetivo

Revisar e otimizar todas as peças de conteúdo Instagram (carrossel, reel, stories) para maximizar engajamento, alcance e saves. Aplicar checklist de otimização baseado nas melhores práticas do algoritmo do Instagram.

## Processo

1. **Auditar hooks** — Verificar se os primeiros 125 caracteres de cada peça são irresistíveis
2. **Revisar word count** — Confirmar 40-80 palavras por slide do carrossel
3. **Otimizar hashtags** — Selecionar mix de 5-15 hashtags (nicho + médio alcance + amplo)
4. **Refinar CTAs** — Garantir que cada CTA é específico e mensurável
5. **Sugerir horários** — Recomendar melhor horário de publicação para cada formato
6. **Cross-check brand voice** — Verificar alinhamento com tom HelloGrowth

## Checklist de Otimização

```yaml
optimization_checklist:
  hooks:
    - item: "Hook do carrossel tem max 125 caracteres?"
      status: "pass | fail"
      fix: "Sugestão de correção se fail"
    - item: "Hook do Reel captura nos primeiros 3s?"
      status: "pass | fail"
      fix: ""
    - item: "Story 1 gera curiosidade para deslizar?"
      status: "pass | fail"
      fix: ""

  content:
    - item: "Slides do carrossel com 40-80 palavras cada?"
      status: "pass | fail"
      fix: ""
    - item: "Reel dentro de 15-30 segundos?"
      status: "pass | fail"
      fix: ""
    - item: "Stories com 3-7 frames?"
      status: "pass | fail"
      fix: ""

  engagement:
    - item: "CTAs são específicos e acionáveis?"
      status: "pass | fail"
      fix: ""
    - item: "Conteúdo é 'salvável' (referência futura)?"
      status: "pass | fail"
      fix: ""
    - item: "Stories têm min 2 elementos interativos?"
      status: "pass | fail"
      fix: ""

  brand:
    - item: "Tom alinhado com HelloGrowth?"
      status: "pass | fail"
      fix: ""
    - item: "Sem palavras proibidas (hack, guru, fórmula mágica)?"
      status: "pass | fail"
      fix: ""
```

## Formato de Saída Complementar

```yaml
optimizations:
  carousel:
    hashtags_optimized:
      - "#reputaçãodigital"  # nicho (50K-200K posts)
      - "#marketingB2B"       # médio (200K-1M posts)
      - "#empreendedorismo"   # amplo (1M+ posts)
    caption_tweaks: "Descrição das alterações na legenda"
    suggested_posting_time: "Terça-feira 08:30 ou Quinta-feira 12:00"
    estimated_engagement: "3-5% baseado em benchmarks similares"

  reel:
    hashtags_optimized: []
    audio_alternative: "Sugestão de áudio trending se disponível"
    caption_tweaks: ""
    suggested_posting_time: "Quarta-feira 19:00 ou Sábado 10:00"

  stories:
    posting_order: "Publicar após o carrossel do feed para direcionar tráfego"
    timing: "Publicar 2-4 horas após o post do feed"
```

## Critérios de Qualidade

1. Todos os itens do checklist foram avaliados (sem "não verificado")
2. Cada "fail" tem sugestão de correção específica
3. Hashtags são relevantes e diversificadas em tamanho
4. Horários sugeridos são justificados com lógica de algoritmo
5. Otimizações não descaracterizam o conteúdo original

## Condições de Veto

- **REJEITAR** se mais de 3 itens do checklist falharem sem correção
- **REFAZER** se hashtags incluírem termos banidos ou irrelevantes
- **REFAZER** se otimizações alterarem o ângulo emocional original
