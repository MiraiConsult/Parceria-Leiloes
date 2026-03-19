import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Gavel, BarChart3, Landmark, Target, TrendingUp, Zap } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-center w-12 h-12 bg-brand-100 text-brand-800 rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl text-brand-900 tracking-wide">PARCERIA LEILÕES</h1>
          <Link to="/login" className="bg-brand-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            Acessar Sistema
          </Link>
        </div>
      </header>

      <main>
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-white"></div>
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-brand-50 to-white"></div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-brand-900 leading-tight tracking-tighter">
              Gestão Financeira Estratégica
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
              A plataforma central para o controle, análise e planejamento financeiro da Parceria Leilões. Visão clara. Decisões inteligentes.
            </p>
            <div className="mt-8">
              <Link to="/login" className="bg-brand-800 text-white px-8 py-4 rounded-lg text-base font-semibold hover:bg-brand-900 shadow-lg transform hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                Acessar o Sistema
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white border-y border-slate-200/80">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Ferramentas Essenciais em um Só Lugar</h2>
              <p className="mt-3 text-slate-500 text-base">
                Otimize a gestão com funcionalidades pensadas para a dinâmica do nosso negócio, desde a visão macro até o detalhe de cada evento.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<LayoutDashboard size={24} />} 
                title="Dashboard Intuitivo" 
                description="Visualize os principais indicadores financeiros, fluxo de caixa e resultados em tempo real para uma tomada de decisão ágil."
              />
              <FeatureCard 
                icon={<BarChart3 size={24} />} 
                title="DRE Gerencial" 
                description="Acompanhe o Demonstrativo de Resultados por regime de competência, com análises detalhadas por centro de custo."
              />
              <FeatureCard 
                icon={<Landmark size={24} />} 
                title="Fluxo de Caixa" 
                description="Controle as entradas e saídas pelo regime de caixa, garantindo a saúde financeira e a liquidez da operação."
              />
              <FeatureCard 
                icon={<Gavel size={24} />} 
                title="Análise de Leilões" 
                description="Relatórios detalhados sobre o desempenho de cada leilão, comparando receitas, custos e lucratividade."
              />
              <FeatureCard 
                icon={<Zap size={24} />} 
                title="Simulador de Cenários" 
                description="Planeje futuros leilões, preveja custos e receitas e simule diferentes cenários para maximizar os resultados."
              />
              <FeatureCard 
                icon={<FileText size={24} />} 
                title="Conciliação Bancária" 
                description="Ferramenta simplificada para conferir e validar os lançamentos em relação aos extratos bancários."
              />
            </div>
          </div>
        </section>
        
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Inteligência que Gera Resultados</h2>
              <p className="mt-3 text-slate-500 text-base">
                Transforme dados brutos em insights estratégicos para o crescimento sustentável da empresa.
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-10 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 bg-brand-800 text-white rounded-full mb-4">
                  <Target size={32} />
                </div>
                <h3 className="text-lg font-bold">Centralização de Dados</h3>
                <p className="text-slate-500 mt-2 text-sm">Todas as informações financeiras em um único local seguro, eliminando planilhas e garantindo consistência.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 bg-brand-800 text-white rounded-full mb-4">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-lg font-bold">Análises em Tempo Real</h3>
                <p className="text-slate-500 mt-2 text-sm">Dashboards e relatórios atualizados instantaneamente para uma visão precisa da saúde financeira da empresa.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 bg-brand-800 text-white rounded-full mb-4">
                  <Zap size={32} />
                </div>
                <h3 className="text-lg font-bold">Decisões Estratégicas</h3>
                <p className="text-slate-500 mt-2 text-sm">Utilize o simulador e as projeções para planejar o futuro com mais segurança e embasamento em dados.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-slate-800 text-slate-400 border-t border-slate-700">
        <div className="container mx-auto px-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Parceria Leilões. Todos os direitos reservados.</p>
          <p className="mt-1">Sistema de Gestão Financeira Interno.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
