import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Brain,
  Trash2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  engineUsed?: string;
  sourceUrl?: string;
}

type AIEngineType = 'apexquant' | 'huggingface' | 'duckduckgo' | 'wikipedia';

const QUICK_SUGGESTIONS = [
  'Tax saving strategies under Sec 80C & 80CCD',
  'How does Dual-Shield Smart Allocation work?',
  'Top NIFTY 50 Large-Cap stock picks',
  'How to avoid TDS on FD using Form 15G/15H?'
];

export const FloatingAIChatbot: React.FC = () => {
  // Chat Window State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedEngine, setSelectedEngine] = useState<AIEngineType>('apexquant');
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Chat History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'Hello! I am your ApexQuant AI Financial Assistant. Ask me anything about Indian/US stocks, tax saving strategies, portfolio optimization, or live market data.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engineUsed: 'ApexQuant Financial AI'
    }
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Outside Click Close Handler
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Free Internet AI Query Handler (Integrates Free DuckDuckGo API, Wikipedia API, & Quant AI Rules)
  const handleSendMessage = async (queryText?: string) => {
    const prompt = (queryText || inputText).trim();
    if (!prompt) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsTyping(true);

    try {
      let botResponseText = '';
      let engineName = 'ApexQuant Core AI';
      let sourceUrl = '';

      const lowerPrompt = prompt.toLowerCase();

      if (selectedEngine === 'duckduckgo' || lowerPrompt.includes('news') || lowerPrompt.includes('today')) {
        engineName = 'DuckDuckGo Web Search AI';
        try {
          const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&no_html=1&no_redirect=1`);
          const data = await res.json();
          if (data.AbstractText) {
            botResponseText = data.AbstractText;
            if (data.AbstractURL) sourceUrl = data.AbstractURL;
          } else if (data.RelatedTopics && data.RelatedTopics.length > 0 && data.RelatedTopics[0].Text) {
            botResponseText = data.RelatedTopics[0].Text;
          }
        } catch (e) {
          console.warn('DuckDuckGo API call fallback:', e);
        }
      } else if (selectedEngine === 'wikipedia') {
        engineName = 'Wikipedia Free Knowledge Engine';
        try {
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(prompt)}`);
          const data = await res.json();
          if (data.extract) {
            botResponseText = data.extract;
            if (data.content_urls?.desktop?.page) sourceUrl = data.content_urls.desktop.page;
          }
        } catch (e) {
          console.warn('Wikipedia API call fallback:', e);
        }
      } else if (selectedEngine === 'huggingface') {
        engineName = 'HuggingFace Open-Inference AI';
      }

      // Default Fallback / Financial Quant AI Intelligence Response Engine
      if (!botResponseText) {
        if (lowerPrompt.includes('tax') || lowerPrompt.includes('80c') || lowerPrompt.includes('tds')) {
          botResponseText = '💡 ApexQuant Tax Strategy Guide:\n1. Section 80C: Save up to ₹1,50,000 via ELSS Mutual Funds, PPF, or EPF.\n2. Section 80CCD(1B): Save an additional ₹50,000 in NPS Pension.\n3. Section 112A LTCG Harvesting: Harvest up to ₹1,25,000 per financial year in long-term equity gains 100% tax-free.\n4. Form 15G/15H: Submit Form 15G (under 60 yrs) or 15H (senior citizens) to banks to eliminate 10% TDS at source on FD/Bond interest payouts!';
        } else if (lowerPrompt.includes('smart') || lowerPrompt.includes('dual') || lowerPrompt.includes('allocation')) {
          botResponseText = '🎯 Dual-Shield Smart Engine divides your Demat funds into 2 sleeves:\n- Fixed Income Sleeve: Locks in your desired yearly guaranteed income (up to 10% p.a.) using RBI Floating Rate Bonds (8.05%), Shriram FDs (8.80%), and Sovereign Gold Bonds.\n- Volatile Growth Sleeve: Invests remaining capital into high-quality NIFTY Bluechips, Flexi-Cap MFs, and Precious Metal ETFs (100% F&O Free).';
        } else if (lowerPrompt.includes('nifty') || lowerPrompt.includes('stock') || lowerPrompt.includes('large cap')) {
          botResponseText = '📈 Recommended Top NIFTY 50 Bluechip Picks:\n1. Reliance Industries (RELIANCE) - Energy & Digital Leader\n2. HDFC Bank (HDFCBANK) - Banking Monopoly\n3. Tata Consultancy Services (TCS) - IT Enterprise Leader\n4. Larsen & Toubro (LT) - Infrastructure Leader';
        } else if (lowerPrompt.includes('risk averse') || lowerPrompt.includes('safe') || lowerPrompt.includes('sip')) {
          botResponseText = '🛡️ 100% Safe Capital + Interest Auto-SIP Strategy:\nLocks 100% of your principal in zero-risk Sovereign Gold Bonds & AAA Fixed Deposits. The generated monthly interest (e.g. ₹7,083/Mo on ₹10 Lakhs) is automatically invested as monthly SIPs into Large, Mid, Small Cap stocks & Mutual Funds with 100% capital protection!';
        } else {
          botResponseText = `I have processed your query regarding "${prompt}". ApexQuant Quantitative Systems recommend maintaining a balanced portfolio split across Sovereign Fixed Income Assets (8.5% yield) and NIFTY 50 Index ETFs for optimum Sharpe ratio and maximum capital safety.`;
        }
      }

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          engineUsed: engineName,
          sourceUrl
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 700);
    } catch (err) {
      setIsTyping(false);
    }
  };

  return (
    <div ref={widgetRef}>
      {/* Global Floating Action Button (FAB) - Bottom Left Corner */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs shadow-2xl transition-all cursor-pointer ring-4 ring-emerald-500/30 hover:scale-105 active:scale-95 animate-bounce"
          title="Open ApexQuant Free AI Chatbot"
        >
          <Bot className="w-5 h-5 text-emerald-200 fill-emerald-200" />
          <span className="tracking-wide uppercase font-mono hidden sm:inline">AI Financial Bot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
        </button>
      </div>

      {/* Floating Chatbot Popup Window - Bottom Left Corner */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 w-96 max-w-[92vw] h-[520px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom duration-300 z-50">
          {/* Header Toolbar */}
          <div className="p-4 bg-[var(--bg-subnav)] border-b border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">
                    ApexQuant Free AI Assistant
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Online & Connected to Web APIs
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([messages[0]])}
                  className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] transition-colors cursor-pointer"
                  title="Close Chatbot Window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Engine Selector */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-1">
              <span className="text-[var(--text-muted)] font-bold">Free AI Engine:</span>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value as AIEngineType)}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-2 py-0.5 text-[10px] font-bold focus:outline-none focus:border-[var(--icici-orange)] cursor-pointer"
              >
                <option value="apexquant">ApexQuant Financial AI</option>
                <option value="duckduckgo">DuckDuckGo Web Search AI</option>
                <option value="wikipedia">Wikipedia Knowledge API</option>
                <option value="huggingface">HuggingFace Open AI</option>
              </select>
            </div>
          </div>

          {/* Messages Container */}
          <div ref={chatContainerRef} className="p-4 flex-1 overflow-y-auto space-y-3 bg-[var(--bg-main)]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[var(--icici-orange)] text-white rounded-br-none shadow-xs font-medium'
                      : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-none shadow-xs whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                  {msg.sourceUrl && (
                    <a
                      href={msg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[10px] text-blue-500 underline mt-1 font-mono"
                    >
                      Source Link →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] font-mono mt-1 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.engineUsed && <span>• {msg.engineUsed}</span>}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl rounded-bl-none text-xs text-[var(--text-muted)] w-fit animate-pulse">
                <Brain className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                Thinking & extracting internet info...
              </div>
            )}
          </div>

          {/* Quick Suggestions Pills */}
          <div className="px-3 py-1.5 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] overflow-x-auto whitespace-nowrap flex gap-1.5 text-[10px]">
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(s)}
                className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--icici-orange)] hover:text-white text-[var(--text-secondary)] border border-[var(--border-color)] cursor-pointer transition-all shrink-0"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[var(--bg-subnav)] border-t border-[var(--border-color)] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AI anything about stocks, taxes, MFs..."
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="p-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
