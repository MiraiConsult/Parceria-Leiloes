import React from 'react';
import { BookOpen, LayoutDashboard, DollarSign, FileText, Landmark, Gavel, DatabaseZap, MessageSquare, LifeBuoy, CheckSquare } from 'lucide-react';

const TutorialSection: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center gap-3">
      {title}
    </h2>
    <div className="prose prose-slate max-w-none text-slate-600 leading-7 prose-headings:font-bold prose-headings:text-slate-700 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-strong:text-slate-800">
      {children}
    </div>
  </section>
);

const Tutorial = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-900 mb-8 text-center">Tutorial de Uso do Sistema Financeiro</h1>

      <TutorialSection title={<><BookOpen size={22} className="text-brand-800" /><span>Bem-vindo!</span></>}>
        <p>
          Esta plataforma foi desenvolvida para centralizar e otimizar a gestão financeira da Parceria Leilões. O objetivo é fornecer uma visão clara e em tempo real da saúde financeira da empresa, facilitando a tomada de decisões estratégicas.
        </p>
        <p>
          Neste tutorial, você encontrará um guia detalhado sobre cada funcionalidade do sistema. Recomendamos a leitura completa para aproveitar ao máximo todas as ferramentas disponíveis.
        </p>
      </TutorialSection>

      <TutorialSection title={<><LayoutDashboard size={22} className="text-brand-800" /><span>Dashboard - Sua Visão Geral</span></>}>
        <p>O <strong>Dashboard</strong> é a primeira tela que você vê ao acessar o sistema. Ele apresenta os principais indicadores financeiros (KPIs) da empresa.</p>
        <ul>
          <li><strong>Filtros:</strong> No topo, você pode filtrar os dados por <strong>Unidade</strong> e <strong>Período</strong> (ano e meses). As informações dos cartões e gráficos serão atualizadas de acordo com sua seleção.</li>
          <li><strong>Abas:</strong> O dashboard é dividido em abas para análises específicas: <em>Visão Geral</em>, <em>Performance Leilões</em>, <em>Análise de Despesas</em> e <em>Análise por Leilão</em>.</li>
          <li><strong>Gráficos Interativos:</strong> Passe o mouse sobre os gráficos para ver detalhes e clique em segmentos (como no gráfico de Treemap) para detalhar as informações.</li>
        </ul>
      </TutorialSection>

      <TutorialSection title={<><DollarSign size={22} className="text-brand-800" /><span>Gestão de Lançamentos</span></>}>
        <p>A tela de <strong>Lançamentos</strong> é onde você gerencia todas as transações financeiras.</p>
        <h4>Adicionando um Lançamento Manual</h4>
        <ol>
          <li>Clique no botão <strong>"+ Novo Lançamento"</strong>.</li>
          <li>Preencha os campos do formulário. Os campos mais importantes são: Valor, Descrição, Rubrica (Plano de Contas) e Banco.</li>
          <li>Se for um lançamento recorrente ou parcelado, utilize a seção <strong>"Repetir / Parcelar"</strong> para gerar múltiplas transações automaticamente.</li>
          <li>Clique em <strong>"Salvar"</strong>. Se seu perfil for de 'Colaborador', o lançamento ficará com status 'Pendente' até ser aprovado por um 'Admin'.</li>
        </ol>
        <h4>Importando Lançamentos em Massa</h4>
        <ol>
          <li>Na tela de Lançamentos, clique em <strong>"Importar Lançamentos"</strong>.</li>
          <li>Na janela que abrir, clique em <strong>"Baixar modelo_lancamentos.xlsx"</strong> para obter a planilha no formato correto.</li>
          <li>Preencha a planilha com seus dados e salve-a.</li>
          <li>Arraste o arquivo para a área indicada ou clique para selecioná-lo.</li>
          <li>Clique em <strong>"Importar"</strong>. O sistema irá validar os dados.</li>
        </ol>
        <h4>Validação de Lançamentos</h4>
        <p>Após a importação, os lançamentos com erros irão para a aba <strong>"Validação Pendente"</strong>. Nesta tela, você pode:</p>
        <ul>
          <li>Corrigir os dados diretamente na tabela.</li>
          <li>Usar a "Edição em Massa" para corrigir múltiplos itens de uma vez.</li>
          <li>Salvar as correções para que os lançamentos sejam efetivamente importados.</li>
          <li>Excluir lançamentos que não devem ser importados.</li>
        </ul>
      </TutorialSection>
      
      <TutorialSection title={<><FileText size={22} className="text-brand-800" /><span>Conciliação Bancária</span></>}>
          <p>A <strong>Conciliação</strong> permite comparar os lançamentos do sistema com o extrato do seu banco.</p>
          <ol>
              <li>Selecione a conta bancária que deseja conciliar no topo da página.</li>
              <li>A tabela exibirá todos os lançamentos aprovados para aquela conta, calculando o saldo projetado após cada transação.</li>
              <li>Compare cada linha com seu extrato bancário. Se estiver correto, clique no ícone de "check" (<CheckSquare size={16} className="inline-block" />) para marcar o lançamento como "Conciliado".</li>
              <li>Você pode selecionar múltiplos lançamentos e usar os botões na barra inferior para "Conciliar" ou "Marcar como Pendente" em massa.</li>
          </ol>
      </TutorialSection>

      <TutorialSection title={<><Landmark size={22} className="text-brand-800" /><span>Relatórios Financeiros: Fluxo de Caixa e DRE</span></>}>
        <p>O sistema gera dois relatórios financeiros cruciais:</p>
        <ul>
          <li><strong>Fluxo de Caixa:</strong> Mostra as entradas e saídas de dinheiro pelo <strong>regime de caixa</strong> (quando o dinheiro efetivamente entrou ou saiu). É essencial para analisar a liquidez da empresa.</li>
          <li><strong>DRE Gerencial:</strong> Mostra o resultado (lucro ou prejuízo) pelo <strong>regime de competência</strong> (quando a receita ou despesa ocorreu, independente do pagamento). É usado para analisar a performance e lucratividade.</li>
        </ul>
        <p><strong>Funcionalidade de Drill-Down:</strong> Em ambos os relatórios, você pode clicar em qualquer valor numérico na tabela. Uma janela de detalhes (modal) se abrirá, mostrando a lista exata de lançamentos que compõem aquele valor.</p>
      </TutorialSection>

      <TutorialSection title={<><Gavel size={22} className="text-brand-800" /><span>Gestão de Leilões</span></>}>
        <p>O sistema possui ferramentas específicas para analisar e planejar leilões.</p>
        <ul>
          <li><strong>Relatório Anual de Leilões:</strong> Oferece uma visão consolidada de todos os leilões realizados no ano, com totais de receita, despesas e saldo final por evento e por mês.</li>
          <li><strong>Simulador de Leilão:</strong> Crie cenários hipotéticos para futuros leilões. Estime receitas (comissões, inscrições) e todos os custos (operacionais, produção, etc.) para prever o resultado financeiro de um evento antes mesmo de ele acontecer.</li>
        </ul>
      </TutorialSection>

      <TutorialSection title={<><DatabaseZap size={22} className="text-brand-800" /><span>Cadastros Essenciais</span></>}>
        <p>A seção de <strong>Cadastros</strong> é o coração do sistema. Manter esses dados atualizados é fundamental para a precisão dos relatórios.</p>
        <ul>
          <li><strong>Plano de Contas:</strong> A estrutura de todas as suas receitas e despesas. É crucial para a correta classificação no DRE e Fluxo de Caixa. Você pode adicionar novas rubricas ou importar uma lista completa.</li>
          <li><strong>Bancos, Unidades, Leilões:</strong> Cadastre todas as entidades que fazem parte da operação da empresa para poder vinculá-las aos lançamentos.</li>
          <li><strong>Usuários:</strong> Gerencie quem tem acesso ao sistema e quais telas cada colaborador pode visualizar.</li>
        </ul>
      </TutorialSection>
      
      <TutorialSection title={<><MessageSquare size={22} className="text-brand-800" /><span>Chat com IA</span></>}>
          <p>O <strong>Chat IA</strong> é seu assistente financeiro pessoal. Você pode fazer perguntas em linguagem natural sobre os dados do sistema.</p>
          <p>Exemplos de perguntas:</p>
          <ul>
              <li>"Qual foi o faturamento total em Março de 2024?"</li>
              <li>"Liste as 5 maiores despesas do último mês."</li>
              <li>"Qual o resultado do 'LEILÃO REVOLUTION - 2025'?"</li>
          </ul>
          <p>A IA analisa os dados carregados no sistema para fornecer respostas rápidas e insights. Lembre-se que a qualidade da resposta depende da qualidade e precisão dos dados inseridos.</p>
      </TutorialSection>

      <TutorialSection title={<><LifeBuoy size={22} className="text-brand-800" /><span>Suporte</span></>}>
        <p>
          Encontrou um problema ou tem alguma dúvida que não foi respondida neste tutorial? Entre em contato com o administrador do sistema ou com o suporte técnico responsável.
        </p>
      </TutorialSection>
    </div>
  );
};

export default Tutorial;
