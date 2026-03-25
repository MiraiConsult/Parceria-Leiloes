---
name: "Criar Post LinkedIn"
order: 1
input:
  description: "História ranqueada com dados-chave, ângulo emocional e contexto da notícia original"
output:
  description: "Post completo de LinkedIn (texto + opcional carrossel-documento) pronto para publicação"
---

# Criar Post LinkedIn

## Objetivo

Desenvolver um post completo para LinkedIn que combine storytelling em primeira pessoa com dados concretos, otimizado para gerar comentários e posicionar a HelloGrowth como autoridade. Opcionalmente, criar conceito de carrossel-documento (PDF) se o conteúdo for educativo/lista.

## Processo

1. **Definir formato** — Post de texto (narrativo/opinião) ou carrossel-documento (educativo/lista)
2. **Criar hook** — Primeira frase impactante em no máximo 210 caracteres
3. **Construir narrativa** — Storytelling em primeira pessoa: experiência → dado → insight
4. **Inserir dado âncora** — Número ou pesquisa que sustenta o argumento central
5. **Escrever CTA** — Pergunta aberta que incentiva comentários qualificados
6. **Selecionar hashtags** — 3-5 hashtags estratégicas (nicho + alcance)
7. **Preparar primeiro comentário** — Link ou contexto adicional para o autor publicar como comentário

## Formato de Saída

```yaml
linkedin_post:
  format: "text | document_carousel"
  hook: "Primeiros 210 caracteres do post"
  body: |
    Texto completo do post com quebras de linha.
    Cada parágrafo com max 2 linhas.
  cta: "Pergunta final para gerar comentários"
  hashtags:
    - "#hashtag1"
    - "#hashtag2"
    - "#hashtag3"
  first_comment: "Texto do primeiro comentário do autor (link + contexto)"
  word_count: 250
  estimated_read_time: "1min"

  # Apenas se format = document_carousel
  carousel_concept:
    title: "Título do carrossel"
    total_pages: 8
    pages:
      - number: 1
        type: "cover"
        headline: "Texto de capa"
        visual_notes: "Indicações de design"
```

## Exemplo de Saída

```yaml
linkedin_post:
  format: "text"
  hook: "Perdi um cliente de R$50K/mês por causa de uma avaliação no Google."
  body: |
    Perdi um cliente de R$50K/mês por causa de uma avaliação no Google.

    Não foi a avaliação em si. Foi a falta de resposta.

    O prospect estava pronto para fechar. Contrato na mesa.
    Aí ele fez o que todo mundo faz: pesquisou no Google.

    Encontrou 3 avaliações negativas sem resposta.
    Nota: 3.8 estrelas.

    Decisão tomada em 30 segundos: "não vou arriscar."

    A McKinsey acaba de confirmar o que eu aprendi da pior forma:
    empresas com nota acima de 4.5 vendem 47% mais.

    47%. Quase metade.

    E a diferença entre 3.8 e 4.5 não é produto.
    Não é preço. Não é marketing.

    É responder avaliações. É pedir feedback. É construir reputação.
  cta: "Qual a nota da sua empresa no Google agora? (Sem olhar — chuta nos comentários 👇)"
  hashtags:
    - "#reputaçãodigital"
    - "#vendasB2B"
    - "#marketingdigital"
    - "#hellogrowth"
  first_comment: "Fonte: Pesquisa McKinsey 2026 com 500 empresas brasileiras. Link para o estudo completo: [URL]. Se sua nota tá abaixo de 4.5, posso compartilhar 3 ações práticas que usamos na HelloGrowth."
  word_count: 142
  estimated_read_time: "45s"
```

## Critérios de Qualidade

1. Hook tem no máximo 210 caracteres e gera vontade de clicar "ver mais"
2. Post usa storytelling em primeira pessoa (não institucional)
3. Pelo menos 1 dado concreto (número, pesquisa, estatística) no corpo
4. Nenhum parágrafo tem mais de 2 linhas
5. CTA é pergunta aberta que incentiva resposta nos comentários
6. 3-5 hashtags relevantes (não genéricas como #success)
7. Nenhum link externo no corpo do post
8. Primeiro comentário preparado com link e/ou contexto adicional
9. Tom alinhado com HelloGrowth: autoridade + acessibilidade

## Condições de Veto

- **REJEITAR** se hook tiver mais de 210 caracteres
- **REJEITAR** se houver link externo no corpo do post
- **REJEITAR** se não houver CTA para comentário
- **REJEITAR** se post for puramente promocional
- **REFAZER** se parágrafos forem longos demais para leitura mobile
- **REFAZER** se não houver dado concreto sustentando o argumento
