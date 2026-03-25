---
name: "Criar Carrossel Instagram Feed"
order: 2
input:
  description: "Ângulo emocional selecionado com hook, tom, framework de copy e história original"
output:
  description: "Carrossel completo de 8-10 slides com texto, indicações visuais e legenda com hashtags"
---

# Criar Carrossel Instagram Feed

## Objetivo

Desenvolver um carrossel completo de 8-10 slides para o Feed do Instagram, seguindo as melhores práticas de engajamento e o posicionamento da HelloGrowth. Referência de estilo: @brandsdecoded__ (carrosséis educativos com design limpo) e @g4club_ (conteúdo de negócios aspiracional).

## Processo

1. **Definir estrutura do carrossel** — Aplicar o framework de copy escolhido (AIDA, PAS ou BAB) à sequência de slides
2. **Escrever Slide 1 (Hook)** — Gancho irresistível com visual impactante; max 15 palavras
3. **Desenvolver slides 2-7 (Corpo)** — Conteúdo principal com 40-80 palavras por slide, uma ideia por slide
4. **Criar Slide 8-9 (Clímax)** — Insight principal ou revelação do dado mais impactante
5. **Finalizar Slide final (CTA)** — Call-to-action específico + identidade HelloGrowth
6. **Escrever legenda** — 150-300 palavras com hook nos primeiros 125 chars, hashtags e CTA

## Formato de Saída

```yaml
carousel:
  title: "Título interno do carrossel"
  angle: "Ângulo emocional utilizado"
  framework: "AIDA | PAS | BAB"
  slides:
    - number: 1
      type: "hook"
      text: "Texto principal do slide"
      subtext: "Texto secundário ou complementar"
      visual: "Descrição detalhada do visual/design"
      word_count: 12
    # ... slides 2-10
  caption:
    hook: "Primeiros 125 caracteres da legenda"
    body: "Corpo completo da legenda"
    cta: "Call-to-action final"
    hashtags:
      - "#hashtag1"
      - "#hashtag2"
```

## Exemplo de Saída (parcial)

```yaml
carousel:
  title: "Reputação = Receita"
  angle: "Medo de ficar para trás"
  framework: "PAS"
  slides:
    - number: 1
      type: "hook"
      text: "47% mais vendas."
      subtext: "E você nem sabia que estava perdendo isso. →"
      visual: "Fundo escuro (#1a1a2e), número 47% em tipografia bold neon verde. Seta deslizar no canto inferior direito."
      word_count: 14
    - number: 2
      type: "problem"
      text: "A maioria das empresas gasta fortunas em anúncios. Mas ignora o ativo que mais influencia a decisão de compra: sua reputação digital."
      subtext: ""
      visual: "Ícone de dinheiro queimando. Fundo gradiente escuro. Texto branco centralizado."
      word_count: 24
  caption:
    hook: "Seus concorrentes estão vendendo 47% mais que você. E não é por causa dos anúncios."
    body: "Uma pesquisa da McKinsey com 500 empresas brasileiras acaba de revelar..."
    cta: "Salva esse carrossel e manda pra alguém que precisa ver esses dados. 💾"
    hashtags:
      - "#reputaçãodigital"
      - "#vendasonline"
      - "#marketingdigital"
      - "#hellogrowth"
      - "#negócios"
```

## Critérios de Qualidade

1. Carrossel tem entre 8 e 10 slides — nunca fora desta faixa
2. Cada slide tem entre 40 e 80 palavras (exceto slide 1 que pode ter menos)
3. Hook nos primeiros 125 caracteres da legenda
4. CTA é específico e acionável (não "curta e compartilhe")
5. Indicações visuais são claras o suficiente para um designer executar
6. Tom alinhado com HelloGrowth: autoridade + acessibilidade
7. Framework de copy é aplicado corretamente na sequência de slides

## Condições de Veto

- **REJEITAR** se carrossel tiver menos de 8 ou mais de 12 slides
- **REJEITAR** se qualquer slide exceder 80 palavras
- **REJEITAR** se não houver CTA no último slide e na legenda
- **REFAZER** se indicações visuais forem vagas (ex: "design bonito")
