---
name: "Gerar Ângulos Emocionais"
order: 1
input:
  description: "Uma história selecionada do ranking com título, resumo, score e ângulos sugeridos pelo pesquisador"
output:
  description: "5 ângulos emocionais distintos, cada um com hook, tom, formato recomendado e framework de copy"
---

# Gerar Ângulos Emocionais

## Objetivo

Transformar UMA história selecionada em 5 abordagens emocionais distintas, cada uma explorando um sentimento ou motivação diferente do público. Cada ângulo deve funcionar como ponto de partida para criação de conteúdo em qualquer formato (carrossel, reel, stories).

## Processo

1. **Analisar a história** — Identificar o dado-chave, o insight principal e as implicações para o público HelloGrowth
2. **Mapear emoções** — Selecionar 5 emoções/motivações distintas (ex: medo de perder, ambição, curiosidade, indignação, inspiração)
3. **Criar hook para cada ângulo** — Escrever o gancho principal que captura a emoção
4. **Definir tom e framework** — Atribuir framework de copy (AIDA, PAS, BAB) e tom específico
5. **Recomendar formato** — Indicar qual formato do Instagram funciona melhor para cada ângulo

## Formato de Saída

```yaml
angles:
  - number: 1
    emotion: "Nome da emoção principal"
    hook: "Frase de gancho completa (max 125 caracteres)"
    approach: "Descrição em 2-3 linhas de como desenvolver este ângulo"
    tone: "Tom específico (ex: provocativo, inspiracional, educativo)"
    framework: "AIDA | PAS | BAB"
    best_format: "Carrossel | Reel | Stories"
    why_it_works: "Por que este ângulo gera engajamento"
```

## Exemplo de Saída

```yaml
source_story: "Empresas com reputação digital forte vendem 47% mais online"

angles:
  - number: 1
    emotion: "Medo de ficar para trás (FOMO)"
    hook: "Seus concorrentes estão vendendo 47% mais que você. Sabe por quê?"
    approach: "Apresentar o dado como ameaça competitiva. Mostrar que quem ignora reputação digital está perdendo dinheiro agora."
    tone: "Urgente e provocativo"
    framework: "PAS"
    best_format: "Carrossel"
    why_it_works: "FOMO competitivo é gatilho forte para donos de negócio"

  - number: 2
    emotion: "Ambição e oportunidade"
    hook: "47% mais vendas. Zero investimento em anúncios. Como?"
    approach: "Posicionar reputação como alavanca gratuita de vendas. Mostrar caminho prático."
    tone: "Inspiracional com dados"
    framework: "BAB"
    best_format: "Reel"
    why_it_works: "Promessa de resultado sem custo extra é irresistível"
```

## Critérios de Qualidade

1. Os 5 ângulos exploram emoções genuinamente diferentes
2. Cada hook tem no máximo 125 caracteres
3. Nenhum ângulo é genérico — todos se conectam à história específica
4. Pelo menos 2 formatos diferentes recomendados entre os 5 ângulos
5. Frameworks de copy são coerentes com a emoção escolhida

## Condições de Veto

- **REJEITAR** se dois ou mais ângulos explorarem a mesma emoção
- **REJEITAR** se hooks ultrapassarem 125 caracteres
- **REFAZER** se nenhum ângulo usar dados da história original
- **REFAZER** se todos recomendarem o mesmo formato
