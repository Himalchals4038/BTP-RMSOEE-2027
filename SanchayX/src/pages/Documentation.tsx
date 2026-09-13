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
    <div className="p-4 lg:p-6 space-y-6 w-full">
      {/* Top Banner */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--icici-orange)]" />
              Financial Knowledge Hub & Wikipedia Integration REST API
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
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
            className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 focus-within:border-[var(--icici-orange)] transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search any company, ticker or financial term (e.g. HDFC Bank, NVIDIA, Bitcoin, Sharpe Ratio, High Yield Debt)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSearchingWiki}
              className="px-4 py-1.5 rounded-lg bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              {isSearchingWiki ? 'Fetching Wiki...' : 'Search Wiki & Dictionary'}
            </button>
          </form>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <span className="text-[11px] text-[var(--text-muted)] font-bold">Featured Topics:</span>
            {['Modern Portfolio Theory', 'Sharpe Ratio', 'Value at Risk', 'High-Yield Bonds', 'Bitcoin', 'HDFC Bank', 'NVIDIA'].map(chip => (
              <button
                key={chip}
                onClick={() => {
                  setSearchTerm(chip);
                  handleSearch(chip);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  searchTerm === chip
                    ? 'bg-[var(--icici-orange)] text-white border-transparent shadow-xs'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Wikipedia Live Depository Summary
            </h3>
            {wikiData?.content_urls?.desktop?.page && (
              <a
                href={wikiData.content_urls.desktop.page}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--icici-orange)] hover:underline font-bold"
              >
                Open on Wikipedia
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {isSearchingWiki ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
              Fetching encyclopedic records from Wikipedia REST API...
            </div>
          ) : wikiData ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {wikiData.thumbnail?.source && (
                  <img
                    src={wikiData.thumbnail.source}
                    alt={wikiData.title}
                    className="w-20 h-20 rounded-xl object-cover border border-[var(--border-color)] shrink-0 bg-[var(--bg-tertiary)]"
                  />
                )}
                <div>
                  <h4 className="text-lg font-bold text-[var(--text-primary)]">{wikiData.title}</h4>
                  {wikiData.description && (
                    <p className="text-xs text-[var(--icici-orange)] font-bold mt-0.5">{wikiData.description}</p>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
                    {wikiData.extract}
                  </p>
                </div>
              </div>

              {selectedDictEntry && (
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 mt-4">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" />
                    Quantitative Formula & Practical Application
                  </div>
                  {selectedDictEntry.formula && (
                    <div className="font-mono text-xs text-[var(--icici-orange)] bg-[var(--bg-card)] p-2 rounded border border-[var(--border-color)] font-bold">
                      {selectedDictEntry.formula}
                    </div>
                  )}
                  <p className="text-xs text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Example: </strong>
                    {selectedDictEntry.example}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              Search any company symbol or financial term above to load Wikipedia summary documentation.
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="glass-card p-5 space-y-4 w-full">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            Quick Asset Documentation Profiles
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Click any asset to load its Wikipedia documentation profile</p>

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
                    ? 'bg-[var(--icici-orange)] border-transparent text-white shadow-xs font-bold'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <div>
                  <span className="font-mono font-bold mr-2">{a.ticker}</span>
                  <span className="text-[11px] opacity-80">{a.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] opacity-90 font-semibold">{a.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theory Reference Manual */}
      <div className="glass-card p-6 space-y-4 w-full">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Quantitative Asset Management & Risk Theory Manual
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Modern Portfolio Theory (MPT)
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Formulated by Harry Markowitz. Demonstrates that an asset risk and return should not be assessed by itself, but by how it contributes to an overall portfolio risk and return.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Sharpe vs Sortino Ratio
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sharpe measures total excess return per unit of total risk. Sortino penalizes only downside volatility, making it superior for crypto and high-growth equities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              High-Yield Bonds & Credit Risk
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Bonds rated below investment grade (BB+ or lower) offering higher yields (8%–12%) to compensate for default risk and economic downturn volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
