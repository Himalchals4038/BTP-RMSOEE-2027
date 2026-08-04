import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchWikipediaSummary, FINANCIAL_DICTIONARY } from '../services/wikiApi';
import type { WikiSummary } from '../services/wikiApi';
import {
  BookOpen,
  Search,
  ExternalLink,
  Award,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText,
  Bookmark,
  Globe
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const { selectedDocTerm, assets } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState<string>(selectedDocTerm || 'Modern Portfolio Theory');
  const [wikiData, setWikiData] = useState<WikiSummary | null>(null);
  const [isSearchingWiki, setIsSearchingWiki] = useState<boolean>(false);

  // Sync state if selectedDocTerm changes from external click
  useEffect(() => {
    if (selectedDocTerm) {
      setSearchTerm(selectedDocTerm);
      handleSearch(selectedDocTerm);
    }
  }, [selectedDocTerm]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingWiki(true);
    try {
      const data = await fetchWikipediaSummary(query);
      setWikiData(data);
    } finally {
      setIsSearchingWiki(false);
    }
  };

  const selectedDictEntry = FINANCIAL_DICTIONARY[searchTerm] || Object.values(FINANCIAL_DICTIONARY).find(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Top Banner: Financial Knowledge Hub & Wikipedia API Search Bar */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Financial Knowledge Hub & Wikipedia Integration REST API
            </h2>
            <p className="text-xs text-slate-400">
              Explore quantitative finance theories, company profiles, asset categories, and live Wikipedia encyclopedic extracts
            </p>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchTerm);
            }}
            className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-all shadow-lg"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search any company, ticker or financial term (e.g. HDFC Bank, NVIDIA, Bitcoin, Sharpe Ratio, High Yield Debt)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSearchingWiki}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              {isSearchingWiki ? 'Fetching Wiki...' : 'Search Wiki & Dictionary'}
            </button>
          </form>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold">Featured Topics:</span>
            {['Modern Portfolio Theory', 'Sharpe Ratio', 'Value at Risk', 'High-Yield Bonds', 'Bitcoin', 'HDFC Bank', 'NVIDIA'].map(chip => (
              <button
                key={chip}
                onClick={() => {
                  setSearchTerm(chip);
                  handleSearch(chip);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                  searchTerm === chip
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Wikipedia & Dictionary Extract Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Wikipedia Live Summary Extract (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Wikipedia Live Depository Summary
            </h3>
            {wikiData?.content_urls?.desktop?.page && (
              <a
                href={wikiData.content_urls.desktop.page}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Open on Wikipedia
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {isSearchingWiki ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Fetching encyclopedic records from Wikipedia REST API...
            </div>
          ) : wikiData ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {wikiData.thumbnail?.source && (
                  <img
                    src={wikiData.thumbnail.source}
                    alt={wikiData.title}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-900"
                  />
                )}
                <div>
                  <h4 className="text-lg font-bold text-white">{wikiData.title}</h4>
                  {wikiData.description && (
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">{wikiData.description}</p>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    {wikiData.extract}
                  </p>
                </div>
              </div>

              {selectedDictEntry && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 mt-4">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" />
                    Quantitative Formula & Practical Application
                  </div>
                  {selectedDictEntry.formula && (
                    <div className="font-mono text-xs text-blue-300 bg-slate-950 p-2 rounded border border-slate-850">
                      {selectedDictEntry.formula}
                    </div>
                  )}
                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-400">Example: </strong>
                    {selectedDictEntry.example}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Search any company symbol or financial term above to load Wikipedia summary documentation.
            </div>
          )}
        </div>

        {/* Right Column: Instrument Quick Selector */}
        <div className="glass-card p-5 space-y-4 w-full">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Quick Asset Documentation Profiles
          </h3>
          <p className="text-xs text-slate-400">Click any asset to load its Wikipedia documentation profile</p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {assets.slice(0, 15).map(a => (
              <button
                key={a.ticker}
                onClick={() => {
                  setSearchTerm(a.name);
                  handleSearch(a.name);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                  searchTerm === a.name
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-white mr-2">{a.ticker}</span>
                  <span className="text-[11px] text-slate-400">{a.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">{a.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Quantitative Finance Theory Reference Manual */}
      <div className="glass-card p-6 space-y-4 w-full">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Quantitative Asset Management & Risk Theory Manual
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Modern Portfolio Theory (MPT)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Formulated by Harry Markowitz. Demonstrates that an asset risk and return should not be assessed by itself, but by how it contributes to an overall portfolio risk and return.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Sharpe vs Sortino Ratio
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sharpe measures total excess return per unit of total risk. Sortino penalizes only downside volatility, making it superior for crypto and high-growth equities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              High-Yield Bonds & Credit Risk
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bonds rated below investment grade (BB+ or lower) offering higher yields (8%–12%) to compensate for default risk and economic downturn volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
