---
name: "Criar Sequência de Stories"
order: 4
input:
  description: "Ângulo emocional selecionado com hook, tom, framework de copy e história original"
output:
  description: "Sequência de 3-7 frames de Stories com texto, elementos interativos e indicações visuais"
---

# Criar Sequência de Stories

## Objetivo

Desenvolver uma sequência de 3-7 frames de Instagram Stories que combine storytelling com elementos interativos nativos (enquete, quiz, slider, caixa de pergunta). O objetivo é maximizar completion rate e gerar dados de engajamento.

## Processo

1. **Definir arco narrativo** — Estruturar a sequência com início (hook), meio (conteúdo) e fim (CTA)
2. **Criar Frame 1 (Hook)** — Capturar atenção imediata com pergunta ou dado impactante
3. **Desenvolver Frames intermediários** — Entregar conteúdo com pelo menos 1 elemento interativo
4. **Incluir interação nativa** — Mínimo 2 elementos interativos na sequência toda
5. **Finalizar com CTA** — Direcionar para ação: ver post no feed, responder, visitar link

## Formato de Saída

```yaml
stories:
  title: "Título interno da sequência"
  total_frames: 5
  angle: "Ângulo emocional"
  frames:
    - number: 1
      type: "hook | content | interactive | cta"
      text: "Texto principal do frame"
      subtext: "Texto complementar"
      interactive_element:
        type: "poll | quiz | slider | question_box | none"
        content: "Conteúdo do elemento interativo"
        options: ["Opção 1", "Opção 2"]
      visual: "Descrição do visual/design"
      sticker_suggestions: "Stickers ou GIFs sugeridos"
```

## Exemplo de Saída

```yaml
stories:
  title: "Reputação Digital — Teste Rápido"
  total_frames: 5
  angle: "Curiosidade + autoanálise"
  frames:
    - number: 1
      type: "hook"
      text: "Sua empresa tá PERDENDO vendas agora."
      subtext: "E o motivo vai te surpreender..."
      interactive_element:
        type: "none"
      visual: "Fundo vermelho escuro, texto branco bold, emoji 🚨"
      sticker_suggestions: "Countdown ou alerta"

    - number: 2
      type: "interactive"
      text: "Você sabe qual é a nota da sua empresa no Google?"
      subtext: ""
      interactive_element:
        type: "poll"
        content: "Você sabe a nota da sua empresa no Google?"
        options: ["Sim, sei de cor", "Nem faço ideia"]
      visual: "Fundo gradiente marca HelloGrowth, texto centralizado"
      sticker_suggestions: "Emoji pensativo 🤔"

    - number: 3
      type: "content"
      text: "A McKinsey provou: empresas com nota acima de 4.5 vendem 47% MAIS."
      subtext: "Pesquisa com 500 empresas brasileiras."
      interactive_element:
        type: "slider"
        content: "Quão importante é reputação online?"
        options: ["emoji: 🔥"]
      visual: "Gráfico simplificado: barra de 4.5★ vs 3.8★. Dados em destaque."
      sticker_suggestions: "Gráfico ou trending up"

    - number: 4
      type: "content"
      text: "3 coisas que derrubam sua nota no Google:"
      subtext: "1. Não responder avaliações\n2. Demorar no atendimento\n3. Não pedir feedback ativo"
      interactive_element:
        type: "quiz"
        content: "Qual derruba MAIS a nota?"
        options: ["Não responder avaliações ✅", "Preço alto", "Pouco conteúdo", "Logo feio"]
      visual: "Lista com ícones, fundo escuro, números em destaque"
      sticker_suggestions: "Dedo apontando para cima"

    - number: 5
      type: "cta"
      text: "Quer saber como aumentar sua reputação digital?"
      subtext: "A gente fez um carrossel completo sobre isso 👇"
      interactive_element:
        type: "none"
      visual: "Logo HelloGrowth centralizado, seta para baixo animada, link para post do feed"
      sticker_suggestions: "Seta para baixo, link sticker"
```

## Critérios de Qualidade

1. Sequência tem entre 3 e 7 frames — nunca fora desta faixa
2. Mínimo 2 elementos interativos nativos na sequência
3. Frame 1 é um hook que gera curiosidade para ver o próximo
4. Último frame tem CTA claro direcionando para ação
5. Arco narrativo completo: início, meio e fim
6. Indicações visuais são executáveis pelo designer

## Condições de Veto

- **REJEITAR** se houver menos de 3 ou mais de 7 frames
- **REJEITAR** se não houver nenhum elemento interativo
- **REJEITAR** se último frame não tiver CTA
- **REFAZER** se todos os frames forem apenas texto sem interação
