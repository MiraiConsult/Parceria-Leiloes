---
type: checkpoint
---

# Seleção de Notícia

Neste passo, apresentamos ao usuário as notícias encontradas pelo pesquisador para que ele escolha a base do conteúdo.

## Instruções de apresentação

1. Exibir as **3 a 5 melhores notícias** do resultado da pesquisa (arquivo research-results.md), mostrando para cada uma:
   - Título
   - Fonte
   - Resumo curto
   - Score de relevância

2. Perguntar ao usuário: **"Qual notícia você gostaria de usar como base para o conteúdo?"**

3. Permitir que o usuário:
   - Selecione uma notícia pelo número
   - Solicite mais opções (caso nenhuma agrade)
   - Sugira um tema próprio diferente das opções apresentadas

## Orientações

- Destaque a notícia com maior score como sugestão recomendada.
- Caso o usuário escolha um tema próprio, registre-o com o mesmo formato das notícias pesquisadas.
- A escolha do usuário será utilizada como input para a geração de ângulos no próximo passo.
