import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Loader } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (prompt: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, isLoading, error, onSendMessage }) => {
  const [input, setInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLocalSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };
  
  const renderContent = (content: string) => {
    // Simple markdown-like rendering for bold and lists
    const lines = content.split('\n');
    const elements = lines.map((line) => {
        let processedLine = line;
        
        // Handle bold
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle lists
        if (processedLine.startsWith('- ')) {
            return `<li style="list-style-type: disc; margin-left: 20px;">${processedLine.substring(2)}</li>`;
        }

        return `<p style="margin: 0;">${processedLine}</p>`;
    });

    return <div dangerouslySetInnerHTML={{ __html: elements.join('') }} />;
  };

  if (error) {
    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-xl shadow-sm border border-red-200 items-center justify-center p-6 text-center">
            <h3 className="text-lg font-bold text-red-700">Erro de Conexão com a IA</h3>
            <p className="text-red-600 mt-2">{error}</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] bg-white rounded-xl shadow-sm border border-slate-100">
      <div ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center text-white"><Bot size={20} /></div>}
            <div className={`max-w-2xl p-4 rounded-xl text-sm leading-6 ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
              {renderContent(msg.content)}
            </div>
            {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white"><UserIcon size={20} /></div>}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center text-white"><Bot size={20} /></div>
            <div className="max-w-xl p-4 rounded-xl bg-slate-100 text-slate-800 flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span>Analisando...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <form onSubmit={handleLocalSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre os dados financeiros..."
            className="flex-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-brand-800 text-white rounded-lg hover:bg-brand-900 shadow-sm transition-colors disabled:bg-brand-700 disabled:opacity-50 flex items-center justify-center w-28"
          >
            {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
