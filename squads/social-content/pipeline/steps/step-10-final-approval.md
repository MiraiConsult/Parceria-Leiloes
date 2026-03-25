---
type: checkpoint
on_reject:
  goto: step-06-create-instagram
---

# Aprovação Final

Neste passo, apresentamos o relatório de revisão de qualidade e solicitamos a aprovação final do usuário.

## Instruções de apresentação

1. Exibir o **relatório de revisão** (review-report.md) com:
   - Score de cada peça de conteúdo (Instagram Feed, Reels, Stories, LinkedIn)
   - Score geral do pacote
   - Pontos fortes e pontos de melhoria identificados
   - Recomendação da revisora (APROVADO ou NECESSITA REVISÃO)

2. Perguntar ao usuário: **"Com base na revisão, qual é sua decisão final?"**

3. Opções disponíveis:

   - **APROVAR** — O conteúdo está pronto para publicação. O pipeline é finalizado com sucesso e os arquivos de output ficam disponíveis para uso.

   - **REJEITAR** — O conteúdo precisa de melhorias. O pipeline retorna à etapa de criação (step-06-create-instagram) para refazer o conteúdo do Instagram e do LinkedIn com base nos feedbacks da revisão.

## Orientações

- Se a revisora recomendou NECESSITA REVISÃO, destaque os ajustes prioritários ao apresentar ao usuário.
- Se o score geral for >= 7 e a revisora recomendou APROVADO, indique isso positivamente ao usuário.
- Em caso de rejeição, solicitar ao usuário orientações específicas sobre o que deseja diferente na nova versão.
- O loop de rejeição retorna ao step-06 (criação Instagram), passando novamente por step-07 (LinkedIn), step-08 (aprovação), step-09 (revisão) e step-10 (aprovação final).
