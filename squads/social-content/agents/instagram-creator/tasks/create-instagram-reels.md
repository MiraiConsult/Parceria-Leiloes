---
name: "Criar Roteiro de Reel"
order: 3
input:
  description: "Ângulo emocional selecionado com hook, tom, framework de copy e história original"
output:
  description: "Roteiro completo de Reel (15-30s) com marcação de tempo, texto na tela, narração e indicações visuais"
---

# Criar Roteiro de Reel

## Objetivo

Desenvolver um roteiro completo para Instagram Reel de 15-30 segundos, otimizado para retenção e engajamento. O Reel deve capturar atenção nos primeiros 3 segundos e entregar valor rapidamente.

## Processo

1. **Definir duração-alvo** — Escolher entre 15s (dado rápido) ou 30s (mini-narrativa) baseado na complexidade do conteúdo
2. **Escrever Hook (0-3s)** — Frase + texto na tela que interrompe o scroll imediatamente
3. **Desenvolver Setup (3-12s)** — Contextualizar o problema ou dado principal
4. **Criar Delivery (12-25s)** — Entregar o insight, dado ou solução principal
5. **Finalizar CTA (últimos 3-5s)** — Ação clara: seguir, salvar, comentar ou visitar perfil

## Formato de Saída

```yaml
reel:
  title: "Título interno do Reel"
  duration: "15s | 30s"
  angle: "Ângulo emocional"
  framework: "AIDA | PAS | BAB"
  sections:
    - timestamp: "0-3s"
      phase: "HOOK"
      narration: "Texto falado / voiceover"
      screen_text: "Texto sobreposto na tela"
      visual: "Descrição do que aparece visualmente"
      energy: "Alta | Média | Baixa"
    # ... demais seções
  caption:
    text: "Legenda do Reel (max 150 palavras)"
    hashtags:
      - "#hashtag1"
  audio_suggestion: "Sugestão de áudio/trilha (trending ou original)"
```

## Exemplo de Saída

```yaml
reel:
  title: "47% Mais Vendas — O Segredo é Reputação"
  duration: "22s"
  angle: "Ambição e oportunidade"
  framework: "BAB"
  sections:
    - timestamp: "0-3s"
      phase: "HOOK"
      narration: "47% mais vendas. Sem gastar um real a mais em anúncio."
      screen_text: "47% MAIS VENDAS 🔥"
      visual: "Pessoa olhando espantada para tela do celular. Zoom rápido no rosto."
      energy: "Alta"
    - timestamp: "3-10s"
      phase: "SETUP"
      narration: "A McKinsey pesquisou 500 empresas brasileiras e descobriu que a diferença entre quem vende e quem vende MUITO não é o orçamento de ads."
      screen_text: "McKinsey | 500 empresas | Brasil"
      visual: "Transição rápida com gráficos aparecendo. Estilo news/dados."
      energy: "Média-Alta"
    - timestamp: "10-18s"
      phase: "DELIVERY"
      narration: "É a reputação digital. Empresas com nota acima de 4.5 no Google vendem quase metade a mais que as concorrentes."
      screen_text: "Nota > 4.5 = 47% mais vendas"
      visual: "Comparativo visual: empresa A (4.5★) vs empresa B (3.8★) com barra de vendas crescendo"
      energy: "Média"
    - timestamp: "18-22s"
      phase: "CTA"
      narration: "Sua reputação tá trabalhando a favor ou contra você? Comenta aqui."
      screen_text: "COMENTA: sua nota no Google 👇"
      visual: "Logo HelloGrowth + texto CTA animado"
      energy: "Média-Alta"
  caption:
    text: "47% mais vendas sem gastar mais em anúncio. A McKinsey provou que reputação digital é o novo ROI. Sua nota no Google tá acima de 4.5? Comenta aqui 👇"
    hashtags:
      - "#reputaçãodigital"
      - "#vendas"
      - "#marketingdigital"
      - "#hellogrowth"
  audio_suggestion: "Trilha trending com beat crescente — ou áudio original com voz over"
```

## Critérios de Qualidade

1. Duração total entre 15 e 30 segundos
2. Hook nos primeiros 3 segundos é impactante e interrompe scroll
3. Texto na tela em TODAS as seções (acessibilidade + retenção)
4. Narração é natural e conversacional — não robótica
5. CTA é específico e gera ação mensurável
6. Indicações visuais são executáveis por um editor de vídeo

## Condições de Veto

- **REJEITAR** se duração ultrapassar 30 segundos
- **REJEITAR** se não houver hook nos primeiros 3 segundos
- **REJEITAR** se alguma seção não tiver texto na tela
- **REFAZER** se narração soar como texto escrito e não fala natural
