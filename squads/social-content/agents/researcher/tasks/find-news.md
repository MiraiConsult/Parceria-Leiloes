---
name: "Encontrar Notícias Relevantes"
order: 1
input:
  description: "Tema de pesquisa e período desejado, definidos em research-focus.md"
output:
  description: "Lista de 8-12 notícias/artigos relevantes com metadados completos em formato estruturado"
---

# Encontrar Notícias Relevantes

## Objetivo

Pesquisar e coletar entre 8 e 12 notícias ou artigos relevantes sobre o tema definido, utilizando múltiplas buscas web para garantir diversidade e profundidade.

## Processo

1. **Ler o foco de pesquisa** — Interpretar o tema, palavras-chave e período definidos no input
2. **Montar 3-5 queries variadas** — Criar buscas com ângulos diferentes (ex: dados, tendência, caso de uso, opinião especialista, impacto no Brasil)
3. **Executar buscas web** — Usar web_search para cada query, coletando os resultados mais relevantes
4. **Acessar e validar fontes** — Usar web_fetch para confirmar conteúdo, extrair dados-chave e verificar data de publicação
5. **Filtrar e organizar** — Remover duplicatas, press releases disfarçados e conteúdo irrelevante; organizar por relevância ao tema

## Formato de Saída

Cada notícia deve seguir este schema YAML:

```yaml
news:
  - title: "Título completo da notícia ou artigo"
    source: "Nome do veículo (ex: Exame, Folha, Bloomberg)"
    url: "https://url-completa-do-artigo.com"
    date: "YYYY-MM-DD"
    summary: "Resumo factual de 2-3 linhas com os dados e insights principais"
    relevance: "Conexão direta com o tema pesquisado e o público HelloGrowth"
```

## Exemplo de Saída

```yaml
news:
  - title: "Empresas com reputação digital forte vendem 47% mais online"
    source: "Valor Econômico"
    url: "https://valor.globo.com/empresas/reputacao-digital-vendas"
    date: "2026-03-18"
    summary: "Estudo da McKinsey com 500 empresas brasileiras revela correlação direta entre nota de reputação no Google e conversão de vendas. Empresas com nota acima de 4.5 tiveram 47% mais vendas que concorrentes com nota abaixo de 4.0."
    relevance: "Dado quantitativo forte sobre reputação e vendas — core da HelloGrowth"

  - title: "LinkedIn ultrapassa Instagram em geração de leads B2B no Brasil"
    source: "Meio & Mensagem"
    url: "https://meioemensagem.com.br/linkedin-leads-b2b-brasil"
    date: "2026-03-15"
    summary: "Pesquisa da RD Station mostra que LinkedIn gerou 3.2x mais leads qualificados que Instagram para empresas B2B brasileiras em 2025. Conteúdo em carrossel teve o maior índice de conversão."
    relevance: "Dado relevante para estratégia multi-plataforma e justificativa de presença no LinkedIn"
```

## Critérios de Qualidade

1. Mínimo de 8 resultados válidos com todos os campos preenchidos
2. Mínimo de 3 fontes/veículos diferentes na lista
3. Todas as notícias dentro do período definido (padrão: últimos 30 dias)
4. Resumos factuais — sem opinião ou interpretação do pesquisador
5. URLs funcionais e acessíveis
6. Relevância clara para o tema pesquisado e público da HelloGrowth

## Condições de Veto

- **REJEITAR** se houver menos de 5 resultados válidos
- **REJEITAR** se todos os resultados forem da mesma fonte
- **REJEITAR** se mais de 50% dos resultados forem press releases ou conteúdo patrocinado
- **REFAZER** se nenhum resultado contiver dados quantitativos
