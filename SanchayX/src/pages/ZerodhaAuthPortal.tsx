import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { MASTER_MARKET_QUOTES } from '../services/liveMarketService';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Lock,
  User,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  KeyRound,
  Calculator,
  RefreshCw,
  X,
  LineChart,
  Eye,
  EyeOff,
  Search,
  Star,
  Quote,
  Layers,
  Award,
  CircleDollarSign,
  Clock
} from 'lucide-react';

// Money Market Instruments Dataset
interface MoneyMarketInstrument {
  id: string;
  name: string;
  category: 'T-Bills' | 'Commercial Paper' | 'Certificates of Deposit' | 'G-Secs & Repo' | 'Liquid Funds' | 'Gold & SGB';
  issuer: string;
  yieldRate: string;
  rating: string;
  minInvestment: string;
  tenure: string;
  riskLevel: string;
  liquidity: string;
  description: string;
  taxBenefit?: string;
}

const MONEY_MARKET_CATALOG: MoneyMarketInstrument[] = [
  {
    id: 'tb-91',
    name: '91-Day Government Treasury Bill',
    category: 'T-Bills',
    issuer: 'Reserve Bank of India / Govt of India',
    yieldRate: '6.85% p.a.',
    rating: 'SOVEREIGN (Zero Default)',
    minInvestment: '₹10,000',
    tenure: '91 Days',
    riskLevel: 'Zero Risk (Sovereign)',
    liquidity: 'High (T+1)',
    description: 'Short-term sovereign debt instrument issued at a discount to face value with 100% principal and return guarantee by the Govt of India.',
    taxBenefit: 'Exempt from TDS deductions.'
  },
  {
    id: 'tb-364',
    name: '364-Day Government Treasury Bill',
    category: 'T-Bills',
    issuer: 'Government of India',
    yieldRate: '7.12% p.a.',
    rating: 'SOVEREIGN (Zero Default)',
    minInvestment: '₹10,000',
    tenure: '364 Days',
    riskLevel: 'Zero Risk (Sovereign)',
    liquidity: 'High (T+1)',
    description: 'One-year sovereign money market benchmark instrument providing predictable yields superior to standard bank savings.',
    taxBenefit: 'No TDS deduction at maturity.'
  },
  {
    id: 'cd-hdfc',
    name: 'HDFC Bank Certificate of Deposit',
    category: 'Certificates of Deposit',
    issuer: 'HDFC Bank Ltd.',
    yieldRate: '7.45% p.a.',
    rating: 'CRISIL A1+ (Highest Safety)',
    minInvestment: '₹1,00,000',
    tenure: '12 Months',
    riskLevel: 'Ultra Low Risk (AAA)',
    liquidity: 'High (T+1)',
    description: 'Negotiable money market term deposit issued by India’s largest private bank, offering institutional wholesale yield rates.',
    taxBenefit: 'Taxable as per individual income slab.'
  },
  {
    id: 'cd-sbi',
    name: 'State Bank of India Tier-1 CD',
    category: 'Certificates of Deposit',
    issuer: 'State Bank of India',
    yieldRate: '7.38% p.a.',
    rating: 'ICRA A1+ (Highest Safety)',
    minInvestment: '₹1,00,000',
    tenure: '6 Months',
    riskLevel: 'Ultra Low Risk (AAA)',
    liquidity: 'High (T+1)',
    description: 'Short-term certificate of deposit backed by India’s largest public sector bank with robust secondary market liquidity.',
    taxBenefit: 'Standard interest taxation.'
  },
  {
    id: 'cp-reliance',
    name: 'Reliance Industries Commercial Paper',
    category: 'Commercial Paper',
    issuer: 'Reliance Industries Ltd.',
    yieldRate: '7.65% p.a.',
    rating: 'CRISIL A1+ (Highest Safety)',
    minInvestment: '₹5,00,000',
    tenure: '90 Days',
    riskLevel: 'Ultra Low Risk (AAA)',
    liquidity: 'High (T+1)',
    description: 'Unsecured corporate debt instrument issued by India’s highest market-cap conglomerate for short-term working capital needs.',
    taxBenefit: 'Capital gains taxation.'
  },
  {
    id: 'cp-tatasons',
    name: 'Tata Sons Commercial Paper',
    category: 'Commercial Paper',
    issuer: 'Tata Sons Pvt. Ltd.',
    yieldRate: '7.55% p.a.',
    rating: 'CRISIL A1+ (Highest Safety)',
    minInvestment: '₹5,00,000',
    tenure: '180 Days',
    riskLevel: 'Ultra Low Risk (AAA)',
    liquidity: 'High (T+1)',
    description: 'Institutional-grade commercial paper backed by the premier holding company of the Tata Group.',
    taxBenefit: 'Taxed at marginal rate.'
  },
  {
    id: 'repo-treps',
    name: 'Triparty Repo (TREPS / CBLO)',
    category: 'G-Secs & Repo',
    issuer: 'Clearing Corporation of India (CCIL)',
    yieldRate: '6.65% p.a.',
    rating: 'SOVEREIGN COLLATERALIZED',
    minInvestment: '₹25,000',
    tenure: 'Overnight to 14 Days',
    riskLevel: 'Zero Risk (Sovereign)',
    liquidity: 'Instant (T+0)',
    description: 'Overnight collateralized borrowing and lending mechanism backed 100% by Central Government Securities held in escrow by CCIL.',
    taxBenefit: 'Overnight daily compounding.'
  },
  {
    id: 'gsec-718',
    name: '7.18% Central Government Security 2033',
    category: 'G-Secs & Repo',
    issuer: 'Reserve Bank of India',
    yieldRate: '7.18% p.a.',
    rating: 'SOVEREIGN (100% Risk Free)',
    minInvestment: '₹10,000',
    tenure: '10 Years',
    riskLevel: 'Zero Risk (Sovereign)',
    liquidity: 'High (T+1)',
    description: 'Benchmark 10-year Indian sovereign bond with semi-annual coupon payouts and zero default risk.',
    taxBenefit: 'Semi-annual direct RBI credit.'
  },
  {
    id: 'sgb-gold',
    name: 'RBI Sovereign Gold Bond (SGB Series)',
    category: 'Gold & SGB',
    issuer: 'Reserve Bank of India on behalf of GoI',
    yieldRate: '2.50% + Gold Price Gain',
    rating: 'SOVEREIGN (100% Safe)',
    minInvestment: '₹7,185 (1 gram)',
    tenure: '8 Years (Exit from 5th year)',
    riskLevel: 'Zero Risk (Sovereign)',
    liquidity: 'High (Traded on NSE/BSE)',
    description: 'Government security denominated in grams of gold. Earns 2.50% guaranteed annual interest plus 100% of gold market appreciation.',
    taxBenefit: '100% Tax-Free capital gains at maturity.'
  },
  {
    id: 'mf-icici-liquid',
    name: 'ICICI Prudential Liquid Mutual Fund',
    category: 'Liquid Funds',
    issuer: 'ICICI Prudential AMC',
    yieldRate: '7.15% p.a.',
    rating: 'CRISIL 1-Ranked Liquid',
    minInvestment: '₹1,000',
    tenure: 'Open Ended (Anytime Exit)',
    riskLevel: 'Ultra Low Risk (AAA)',
    liquidity: 'Instant (T+0 up to ₹50,000)',
    description: 'Direct plan mutual fund investing in up to 91-day sovereign and AAA commercial papers with 0% exit load after 7 days.',
    taxBenefit: '0% Commission Direct SIP.'
  }
];

// User Testimonials Dataset
interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  badge: string;
  metric: string;
  content: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Vikramaditya Singhal',
    role: 'VP Quantitative Alpha, AlphaEdge Capital',
    avatar: 'VS',
    rating: 5,
    badge: 'Institutional Member',
    metric: '+31.4% Sharpe 1.85',
    content: 'SanchayX replaced our costly Bloomberg terminal scripts. The client-side Markowitz optimizer computes 1,000 asset permutations in under 200ms. The DualShield engine seamlessly protects our clients during high-volatility events.'
  },
  {
    id: 2,
    name: 'Ananya Deshmukh',
    role: 'HNI Portfolio Investor, Mumbai',
    avatar: 'AD',
    rating: 5,
    badge: 'Verified Investor',
    metric: 'Saved ₹52,000 in Brokerage',
    content: 'Zero brokerage on equity delivery combined with Groww-like sleek usability is unmatched. I allocated 40% into Sovereign Gold Bonds and 60% into Nifty Bluechips using the 100% Safe Engine. Cleanest platform in India.'
  },
  {
    id: 3,
    name: 'Rohit Khandelwal',
    role: 'F&O Derivatives & Options Trader',
    avatar: 'RK',
    rating: 5,
    badge: 'Active F&O Trader',
    metric: '74% Options Win Rate',
    content: 'The strategy backtester allowed me to backtest my Iron Condor and Bull Call spreads across 5 years of tick data before deploying real margin. Flat ₹20 per trade saves me thousands every month.'
  },
  {
    id: 4,
    name: 'Sneha Roy',
    role: 'Quant Researcher, IIT Kharagpur',
    avatar: 'SR',
    rating: 5,
    badge: 'Student Quant Fellow',
    metric: '₹10L Virtual Sandbox',
    content: 'As an engineering student researching financial engineering, the preloaded ₹10 Lakh virtual sandbox and real-time covariance matrix calculators helped me master portfolio construction without taking financial risks.'
  },
  {
    id: 5,
    name: 'Col. Rajeshwar Nair (Retd.)',
    role: 'Senior Citizen & Pension Investor',
    avatar: 'RN',
    rating: 5,
    badge: 'Safe Yield Member',
    metric: '8.2% Guaranteed Yield',
    content: 'I only invest in zero-risk instruments. The Money Market and Safe Investment search tool showed me exactly how to park capital in RBI Treasury Bills and AAA Corporate FDs with 100% peace of mind.'
  }
];

// Interactive Category Spotlight Datasets
interface CategoryShowcaseItem {
  id: string;
  name: string;
  tickerOrIssuer: string;
  tag: string;
  metricLabel: string;
  metricValue: string;
  metricColor: 'emerald' | 'blue' | 'amber' | 'purple';
  description: string;
  brokerageTag: string;
  actionText: string;
  categoryType: 'stocks' | 'fno' | 'mf' | 'money_market' | 'gold' | 'fd';
}

interface CategoryInfo {
  id: string;
  title: string;
  highlightText: string;
  description: string;
  badge: string;
  badgeColor: string;
  stat1: { label: string; value: string };
  stat2: { label: string; value: string };
  stat3: { label: string; value: string };
  items: CategoryShowcaseItem[];
}

const CATEGORY_SHOWCASE: Record<string, CategoryInfo> = {
  All: {
    id: 'All',
    title: 'Invest in everything.',
    highlightText: 'Trade with mathematical edge.',
    description: 'Online multi-asset platform to invest in Indian Equities, US Tech Stocks, F&O Options, Direct Mutual Funds, Sovereign Gold Bonds, and Money Market Instruments with Nobel-prize winning Markowitz optimization.',
    badge: 'Zero Brokerage • Institutional MPT Engine • 100% Safe Sovereign Shield',
    badgeColor: 'emerald',
    stat1: { label: 'Equity Delivery', value: '₹0 Free' },
    stat2: { label: 'F&O Derivatives', value: 'Flat ₹20' },
    stat3: { label: 'Virtual Sandbox', value: '₹10,00,000' },
    items: []
  },
  Stocks: {
    id: 'Stocks',
    title: 'Invest in Stocks & ETFs.',
    highlightText: 'Zero brokerage on all equity deliveries.',
    description: 'Buy and hold NIFTY 50 Indian bluechips and S&P 500 Global tech equities with automated Markowitz quadratic optimization, real-time covariance matrices, and instant portfolio rebalancing.',
    badge: '₹0 Delivery Brokerage • 5,000+ NSE/BSE & US Stocks • Fractional Units',
    badgeColor: 'emerald',
    stat1: { label: 'Delivery Brokerage', value: '₹0 Free' },
    stat2: { label: 'NIFTY 50 Coverage', value: '100% Live' },
    stat3: { label: 'Execution Speed', value: '< 1ms Engine' },
    items: [
      { id: 'rel', name: 'Reliance Industries', tickerOrIssuer: 'RELIANCE • NSE', tag: 'Energy & Retail', metricLabel: 'Live Price', metricValue: '₹2,980.50 (+1.2%)', metricColor: 'emerald', description: 'India’s largest conglomerate with dominant retail, telecom, and green energy market share.', brokerageTag: '₹0 Brokerage', actionText: 'Simulate Buy', categoryType: 'stocks' },
      { id: 'tcs', name: 'Tata Consultancy Services', tickerOrIssuer: 'TCS • NSE', tag: 'IT Services', metricLabel: 'Live Price', metricValue: '₹4,120.00 (+0.8%)', metricColor: 'emerald', description: 'Global digital IT transformation leader with industry-leading operating profit margins.', brokerageTag: '₹0 Brokerage', actionText: 'Simulate Buy', categoryType: 'stocks' },
      { id: 'hdfc', name: 'HDFC Bank Ltd.', tickerOrIssuer: 'HDFCBANK • NSE', tag: 'Banking & Financials', metricLabel: 'Live Price', metricValue: '₹1,640.20 (+0.5%)', metricColor: 'emerald', description: 'India’s largest private lender with stellar asset quality and fortress balance sheet.', brokerageTag: '₹0 Brokerage', actionText: 'Simulate Buy', categoryType: 'stocks' },
      { id: 'aapl', name: 'Apple Inc. (US Tech)', tickerOrIssuer: 'AAPL • NASDAQ', tag: 'Global Tech', metricLabel: 'Live Price', metricValue: '$225.40 (+1.4%)', metricColor: 'blue', description: 'Consumer tech giant with $3T+ ecosystem, expanding AI devices and high-margin services.', brokerageTag: 'Zero Commission', actionText: 'Simulate Buy', categoryType: 'stocks' }
    ]
  },
  'F&O': {
    id: 'F&O',
    title: 'Futures & Options Terminal.',
    highlightText: 'Flat ₹20 per trade. Zero hidden slippage.',
    description: 'Execute multi-leg options strategies (Iron Condors, Straddles, Bull Spreads) on NIFTY, BANKNIFTY, and FINNIFTY with live Black-Scholes Greeks and 5-year historical tick backtesting.',
    badge: 'Flat ₹20 / Trade • 5-Year Tick Backtester • Real-Time Option Greeks',
    badgeColor: 'blue',
    stat1: { label: 'F&O Brokerage', value: 'Flat ₹20/trade' },
    stat2: { label: 'Option Greeks', value: 'Delta, Gamma, Vega' },
    stat3: { label: 'Backtest History', value: '5+ Years' },
    items: [
      { id: 'ic', name: 'NIFTY Weekly Iron Condor', tickerOrIssuer: 'Options Strategy Template', tag: 'Delta Neutral', metricLabel: 'Win Probability', metricValue: '78.4%', metricColor: 'blue', description: '4-leg options spread generating steady premium decay during market consolidation.', brokerageTag: 'Flat ₹20/Order', actionText: 'Open Backtester', categoryType: 'fno' },
      { id: 'strad', name: 'BANKNIFTY Expiry Straddle', tickerOrIssuer: 'Volatility Breakout', tag: 'High Gamma', metricLabel: 'Profit Factor', metricValue: '2.14x', metricColor: 'emerald', description: 'Exploits high-volatility directional expansions on weekly index expiry dates.', brokerageTag: 'Flat ₹20/Order', actionText: 'Backtest Strategy', categoryType: 'fno' },
      { id: 'bull', name: 'NIFTY Bull Call Spread', tickerOrIssuer: 'Directional Momentum', tag: 'Capped Risk', metricLabel: 'Max Risk/Reward', metricValue: '1:3.2', metricColor: 'emerald', description: 'Low margin requirement with predefined maximum profit and strictly capped maximum loss.', brokerageTag: 'Flat ₹20/Order', actionText: 'Simulate in Terminal', categoryType: 'fno' }
    ]
  },
  'Mutual Funds': {
    id: 'Mutual Funds',
    title: 'Direct Mutual Funds.',
    highlightText: '0% commission direct SIPs.',
    description: 'Invest in direct plan mutual funds with zero distributor commissions, saving up to 1.5% in extra compound returns every single year. Setup automated SIPs and portfolio rebalancing.',
    badge: '0% Commission • 2,000+ Direct Mutual Funds • Automated SIPs',
    badgeColor: 'emerald',
    stat1: { label: 'Commission', value: '0% Direct Plans' },
    stat2: { label: 'Annual Compound Saving', value: 'Up to 1.5%' },
    stat3: { label: 'Minimum SIP', value: '₹500 / month' },
    items: [
      { id: 'mf1', name: 'Quant Small Cap Fund (Direct)', tickerOrIssuer: 'Quant AMC', tag: 'Small Cap Growth', metricLabel: '3-Year CAGR Return', metricValue: '+28.4% p.a.', metricColor: 'emerald', description: 'Quantitative predictive momentum strategy capturing high-alpha Indian small caps.', brokerageTag: '0% Commission', actionText: 'Simulate SIP', categoryType: 'mf' },
      { id: 'mf2', name: 'Parag Parikh Flexi Cap (Direct)', tickerOrIssuer: 'PPFAS AMC', tag: 'Flexi Cap Value', metricLabel: '3-Year CAGR Return', metricValue: '+21.2% p.a.', metricColor: 'emerald', description: 'Veteran value compounder investing across Indian leaders and global technology.', brokerageTag: '0% Commission', actionText: 'Simulate SIP', categoryType: 'mf' },
      { id: 'mf3', name: 'Mirae Asset Large Cap (Direct)', tickerOrIssuer: 'Mirae Asset AMC', tag: 'Bluechip Equity', metricLabel: '3-Year CAGR Return', metricValue: '+18.6% p.a.', metricColor: 'emerald', description: 'Core large cap portfolio investing in India’s top 100 established market leaders.', brokerageTag: '0% Commission', actionText: 'Simulate SIP', categoryType: 'mf' }
    ]
  },
  'Money Market': {
    id: 'Money Market',
    title: 'Money Market & T-Bills.',
    highlightText: 'Sovereign guaranteed yields with instant liquidity.',
    description: 'Institutional-grade access to Government of India 91-Day and 364-Day Treasury Bills, Bank Certificates of Deposit (CDs), and Commercial Papers with zero default risk.',
    badge: '100% Sovereign Guarantee • Wholesale Rates • T+0 / T+1 Settlement',
    badgeColor: 'amber',
    stat1: { label: '91-Day T-Bill Yield', value: '6.85% p.a.' },
    stat2: { label: '364-Day T-Bill Yield', value: '7.12% p.a.' },
    stat3: { label: 'Default Risk', value: '0% (RBI Backed)' },
    items: [
      { id: 'tb91', name: '91-Day Government Treasury Bill', tickerOrIssuer: 'Reserve Bank of India', tag: 'Sovereign Debt', metricLabel: 'Annual Yield (YTM)', metricValue: '6.85% p.a.', metricColor: 'emerald', description: 'Zero default risk short-term debt instrument with 100% capital guarantee by Govt of India.', brokerageTag: 'RBI Sovereign', actionText: 'Inspect Instrument', categoryType: 'money_market' },
      { id: 'tb364', name: '364-Day Government Treasury Bill', tickerOrIssuer: 'Government of India', tag: 'Sovereign Debt', metricLabel: 'Annual Yield (YTM)', metricValue: '7.12% p.a.', metricColor: 'emerald', description: 'One-year risk-free benchmark instrument exempt from TDS deductions at maturity.', brokerageTag: 'RBI Sovereign', actionText: 'Inspect Instrument', categoryType: 'money_market' },
      { id: 'cdhdfc', name: 'HDFC Bank Certificate of Deposit', tickerOrIssuer: 'HDFC Bank Ltd.', tag: 'Wholesale Deposit', metricLabel: 'Annual Yield (YTM)', metricValue: '7.45% p.a.', metricColor: 'blue', description: 'Wholesale money market term certificate rated CRISIL A1+ with high secondary liquidity.', brokerageTag: 'CRISIL A1+', actionText: 'Inspect Instrument', categoryType: 'money_market' }
    ]
  },
  Gold: {
    id: 'Gold',
    title: 'Sovereign Gold Bonds (SGB).',
    highlightText: '2.50% guaranteed annual coupon + 100% tax-free gold upside.',
    description: 'Invest in RBI-issued Sovereign Gold Bonds. Earn 2.50% guaranteed annual interest credited directly to your bank account plus 100% of gold market upside with zero making charges.',
    badge: '100% Tax-Free at Maturity • 2.50% Guaranteed Interest • RBI Backed',
    badgeColor: 'amber',
    stat1: { label: 'Annual Interest', value: '2.50% p.a.' },
    stat2: { label: 'Capital Gains Tax', value: '100% Tax Free' },
    stat3: { label: 'Storage & Making Cost', value: '₹0 Zero' },
    items: [
      { id: 'sgb1', name: 'RBI Sovereign Gold Bond (2026 Series)', tickerOrIssuer: 'Reserve Bank of India', tag: 'Gold Security', metricLabel: 'Issue Price / Gram', metricValue: '₹7,185 / gram', metricColor: 'amber', description: 'Government security denominated in grams of gold. Earns 2.5% p.a. + 100% tax-free appreciation.', brokerageTag: '100% Tax Free', actionText: 'Simulate in Terminal', categoryType: 'gold' },
      { id: 'gldetf', name: 'Nippon India Gold BeES ETF', tickerOrIssuer: 'Nippon Life AMC', tag: 'Gold ETF', metricLabel: 'Live Price', metricValue: '₹64.20 (+0.4%)', metricColor: 'emerald', description: 'Intraday traded physical gold ETF on NSE with real-time liquidity and delivery settlement.', brokerageTag: '₹0 Delivery', actionText: 'Simulate Buy', categoryType: 'gold' },
      { id: 'gsec', name: '7.18% GS 2033 Sovereign Bond', tickerOrIssuer: 'Government of India', tag: 'Central G-Sec', metricLabel: 'Annual Coupon', metricValue: '7.18% p.a.', metricColor: 'blue', description: 'Benchmark 10-year central government sovereign bond with semi-annual coupon payouts.', brokerageTag: 'Zero Risk', actionText: 'Simulate Allocation', categoryType: 'gold' }
    ]
  },
  FD: {
    id: 'FD',
    title: 'Corporate Fixed Deposits.',
    highlightText: 'Up to 8.85% p.a. guaranteed interest.',
    description: 'High-yield corporate fixed deposits from AAA-rated institutions like Bajaj Finance, HDFC Bank, and Shriram Finance with flexible tenures from 12 to 60 months.',
    badge: 'CRISIL / ICRA AAA Rated • Up to 8.85% Returns • Monthly / Annual Compounding',
    badgeColor: 'blue',
    stat1: { label: 'Highest FD Rate', value: '8.85% p.a.' },
    stat2: { label: 'Safety Rating', value: 'CRISIL AAA' },
    stat3: { label: 'Senior Citizen Extra', value: '+0.25% - 0.50%' },
    items: [
      { id: 'fd1', name: 'Bajaj Finance Corporate FD', tickerOrIssuer: 'Bajaj Finance Ltd.', tag: 'CRISIL AAA (Highest Safety)', metricLabel: 'Interest Rate', metricValue: '8.85% p.a.', metricColor: 'emerald', description: 'Highest safety rating with flexible monthly, quarterly, or cumulative interest compounding options.', brokerageTag: 'CRISIL AAA', actionText: 'Calculate Returns', categoryType: 'fd' },
      { id: 'fd2', name: 'Shriram Finance Fixed Deposit', tickerOrIssuer: 'Shriram Finance Ltd.', tag: 'ICRA AA+ (Stable)', metricLabel: 'Interest Rate', metricValue: '8.75% p.a.', metricColor: 'emerald', description: 'Attractive high yield term deposit offering an additional 0.50% p.a. for senior citizens.', brokerageTag: 'High Yield', actionText: 'Calculate Returns', categoryType: 'fd' },
      { id: 'fd3', name: 'HDFC Bank Special Term Deposit', tickerOrIssuer: 'HDFC Bank Ltd.', tag: 'Scheduled Commercial Bank', metricLabel: 'Interest Rate', metricValue: '7.75% p.a.', metricColor: 'blue', description: 'Secure fixed tenure term deposit backed by India’s largest private banking institution.', brokerageTag: 'DICGC Insured', actionText: 'Calculate Returns', categoryType: 'fd' }
    ]
  }
};

export const ZerodhaAuthPortal: React.FC = () => {
  const {
    loginUser,
    loginDemoUser,
    signUpUser,
    theme,
    toggleTheme,
    marketHours,
    liveMarketQuotes,
    isMarketDataLoading,
    refreshMarketData
  } = usePortfolio();

  // Active Top Navigation Modal state (including Market Timings)
  const [activeNavModal, setActiveNavModal] = useState<'about' | 'products' | 'pricing' | 'support' | 'market_timings' | null>(null);

  // Auth Box state: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login flow states: 1 = Credentials (User ID / Pass), 2 = Kite 6-Digit 2FA PIN
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('8512437145');
  const [password, setPassword] = useState('SanchayX@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [pinDigits, setPinDigits] = useState(['1', '2', '3', '4', '5', '6']);
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Signup flow states (3-Step Wizard)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAccountType, setSignupAccountType] = useState<'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo'>('Retail HNI');
  const [signupSegments, setSignupSegments] = useState<string[]>(['Equity Delivery', 'Smart 100% Safe Shield', 'Mutual Funds']);

  // Beginner Guide Tab in Hero
  const [activeGuideTab, setActiveGuideTab] = useState<'mpt' | 'safe' | 'algo'>('mpt');

  // Major Indices Sliding Marquee Hover Pause State
  const [isTickerPaused, setIsTickerPaused] = useState(false);

  // Groww-Style Category Filter Pills
  const [activeCategoryPill, setActiveCategoryPill] = useState<string>('All');

  // Money Market Instruments Search state
  const [moneyMarketSearch, setMoneyMarketSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeInstrumentModal, setActiveInstrumentModal] = useState<MoneyMarketInstrument | null>(null);

  // Testimonials Slider state
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState<number>(0);
  const [isAutoPlayTestimonials, setIsAutoPlayTestimonials] = useState<boolean>(true);

  // Calculator state in Pricing Modal
  const [calcTrades, setCalcTrades] = useState<number>(20);
  const [calcTurnover, setCalcTurnover] = useState<number>(200000);

  // Search in Support Modal
  const [supportSearch, setSupportSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auto-play Testimonials Slider
  useEffect(() => {
    if (!isAutoPlayTestimonials) return;
    const timer = setInterval(() => {
      setCurrentTestimonialIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isAutoPlayTestimonials]);

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((currentTestimonialIndex + 1) % TESTIMONIALS.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((currentTestimonialIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  // Filter Money Market Instruments
  const filteredMoneyMarketInstruments = MONEY_MARKET_CATALOG.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(moneyMarketSearch.toLowerCase()) ||
                         item.issuer.toLowerCase().includes(moneyMarketSearch.toLowerCase()) ||
                         item.category.toLowerCase().includes(moneyMarketSearch.toLowerCase()) ||
                         item.rating.toLowerCase().includes(moneyMarketSearch.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Handle Login Step 1 submission
  const handleLoginStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setLoginError('Please enter a valid User ID or Mobile Number');
      return;
    }
    setLoginError('');
    setLoginStep(2);
  };

  // Handle PIN input change
  const handlePinChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newDigits = [...pinDigits];
    newDigits[index] = val;
    setPinDigits(newDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle Login Final Submission (Step 2 PIN)
  const handleLoginStep2Submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullPin = pinDigits.join('');
    if (fullPin.length < 6) {
      setLoginError('Please enter your 6-digit Kite PIN');
      return;
    }

    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      loginUser(userId, password, 'SanchayX Trader');
    }, 600);
  };

  const handleKeypadPress = (digit: string) => {
    const emptyIndex = pinDigits.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      const newDigits = [...pinDigits];
      newDigits[emptyIndex] = digit;
      setPinDigits(newDigits);
    }
  };

  const handleKeypadBackspace = () => {
    const lastFilledIndex = [...pinDigits].reverse().findIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      const realIndex = 5 - lastFilledIndex;
      const newDigits = [...pinDigits];
      newDigits[realIndex] = '';
      setPinDigits(newDigits);
    }
  };

  const handleSignupStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim()) {
      setLoginError('Please fill in your legal name and email address');
      return;
    }
    setLoginError('');
    setSignupStep(2);
  };

  const handleSignupStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupStep(3);
  };

  const handleSignupFinal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      signUpUser({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        accountType: signupAccountType
      });
    }, 800);
  };

  const toggleSegment = (seg: string) => {
    setSignupSegments(prev =>
      prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
    );
  };

  const faqs = [
    {
      q: 'How does SanchayX work and how is it inspired by Zerodha & Groww?',
      a: 'SanchayX combines Zerodha’s zero-brokerage pricing with Groww’s intuitive, beginner-friendly UI and hedge-fund grade Markowitz Modern Portfolio Theory (MPT). It offers full access to algorithmic rebalancing, money market instruments, and 100% safe guaranteed yields.'
    },
    {
      q: 'What is the Markowitz Modern Portfolio Theory (MPT) and Sharpe Ratio?',
      a: 'MPT mathematical optimization calculates asset weights that maximize expected portfolio return for a given level of risk. The Sharpe Ratio measures excess return per unit of volatility — higher Sharpe (> 1.2) means superior risk-adjusted performance.'
    },
    {
      q: 'How are returns in the "100% Safe Investment Engine" guaranteed?',
      a: 'The 100% Safe Investment Engine exclusively allocates capital to Sovereign Gold Bonds (SGB backed by the Reserve Bank of India), Central Government Securities (G-Secs), AAA-rated Public Sector Bonds, and Scheduled Bank Fixed Deposits, guaranteeing zero principal risk.'
    },
    {
      q: 'Can I practice with simulated virtual cash before trading live?',
      a: 'Yes! Every new account and sandbox demo is automatically pre-funded with ₹10,00,000 in virtual paper trading cash, allowing you to test MPT portfolios, place live simulation orders, and backtest F&O strategies risk-free.'
    },
    {
      q: 'What are the charges for Equity Delivery, Intraday, and F&O?',
      a: 'Equity Delivery is completely ₹0 (Free). Intraday and F&O derivatives are charged at a flat ₹20 or 0.03% (whichever is lower) per executed order. Direct Mutual Funds have 0% commission.'
    }
  ];

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(supportSearch.toLowerCase()) ||
         f.a.toLowerCase().includes(supportSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--groww-emerald)] selection:text-black">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (ZERODHA & GROWW HYBRID STYLE) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-200 shadow-xs">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => { setAuthMode('login'); setLoginStep(1); }}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00d09c] via-[#00b386] to-[#0284c7] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <span className="italic font-serif">SX</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                  Sanchay<span className="text-[var(--groww-emerald)]">X</span>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-[var(--groww-emerald)] border border-emerald-500/20 tracking-wider">
                  DIRECT OS
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Quant Investing, Simplified</p>
            </div>
          </div>

          {/* Navigation Headings */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-semibold">
            <button
              onClick={() => { setAuthMode('signup'); setSignupStep(1); }}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'text-[var(--groww-emerald)] font-bold bg-emerald-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Sign Up
            </button>

            <button
              onClick={() => setActiveNavModal('about')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeNavModal === 'about'
                  ? 'text-[var(--groww-emerald)] font-bold bg-emerald-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              About
            </button>

            <button
              onClick={() => setActiveNavModal('products')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeNavModal === 'products'
                  ? 'text-[var(--groww-emerald)] font-bold bg-emerald-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Products
            </button>

            <button
              onClick={() => setActiveNavModal('pricing')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeNavModal === 'pricing'
                  ? 'text-[var(--groww-emerald)] font-bold bg-emerald-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Pricing
            </button>

            <button
              onClick={() => setActiveNavModal('support')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeNavModal === 'support'
                  ? 'text-[var(--groww-emerald)] font-bold bg-emerald-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Support & FAQs
            </button>
          </nav>

          {/* Right Action Buttons & Theme Switcher */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-all cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={() => loginDemoUser('Sandbox Demo')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="Enter terminal instantly with ₹10L virtual sandbox cash"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant Sandbox</span>
            </button>

            <button
              onClick={() => {
                setAuthMode('login');
                setLoginStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-[var(--groww-emerald)] hover:bg-[var(--groww-emerald-hover)] text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Client Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME LIVE MARKET PULSE & CONTINUOUS SLIDING INDICES TICKER */}
      {/* ========================================================================= */}
      {(() => {
        const getSafeQuote = (
          key: string,
          icon: string,
          defaultSymbol: string,
          defaultName: string,
          defaultPrice: number,
          defaultChange: number,
          defaultPct: number,
          curr: string,
          currSym: string
        ) => {
          const live = liveMarketQuotes ? liveMarketQuotes[key] : undefined;
          const master = MASTER_MARKET_QUOTES ? MASTER_MARKET_QUOTES[key] : undefined;
          return {
            symbol: live?.symbol || master?.symbol || defaultSymbol,
            name: live?.name || master?.name || defaultName,
            price: live?.price ?? master?.price ?? defaultPrice,
            change: live?.change ?? master?.change ?? defaultChange,
            changePct: live?.changePct ?? master?.changePct ?? defaultPct,
            currency: curr,
            currencySymbol: currSym,
            icon: icon,
            lastUpdated: live?.lastUpdated || master?.lastUpdated || 'Official Close'
          };
        };

        const tickerQuotesList = [
          getSafeQuote('NIFTY_50', '🇮🇳', 'NIFTY 50', 'Nifty 50 Index', 24520.40, 185.30, 0.76, 'INR', '₹'),
          getSafeQuote('SENSEX', '🇮🇳', 'SENSEX', 'BSE Sensex', 80436.80, 512.10, 0.64, 'INR', '₹'),
          getSafeQuote('BANK_NIFTY', '🏦', 'BANK NIFTY', 'Nifty Bank Index', 51840.10, 470.50, 0.92, 'INR', '₹'),
          getSafeQuote('NIFTY_IT', '💻', 'NIFTY IT', 'Nifty IT Index', 41250.00, 380.00, 0.93, 'INR', '₹'),
          getSafeQuote('SP_500', '🇺🇸', 'S&P 500', 'S&P 500 Index', 5540.20, 32.10, 0.58, 'USD', '$'),
          getSafeQuote('NASDAQ_100', '🇺🇸', 'NASDAQ 100', 'Nasdaq 100 Index', 19650.80, 145.20, 0.74, 'USD', '$'),
          getSafeQuote('DOW_JONES', '🇺🇸', 'DOW JONES', 'Dow Jones Industrial', 40850.50, 190.00, 0.47, 'USD', '$'),
          getSafeQuote('GOLD_24K', '🪙', 'GOLD 24K', 'MCX Gold (10g / 24K)', 71850.00, 250.00, 0.35, 'INR', '₹'),
          getSafeQuote('SILVER_1KG', '🥈', 'SILVER MCX', 'MCX Silver (1kg 999)', 84200.00, 620.00, 0.74, 'INR', '₹'),
          getSafeQuote('CRUDE_OIL', '🛢️', 'CRUDE OIL', 'Brent Crude Oil (BBL)', 6420.00, -29.00, -0.45, 'INR', '₹'),
          getSafeQuote('USD_INR', '💵', 'USD / INR', 'US Dollar / Indian Rupee', 83.92, 0.04, 0.05, 'INR', '₹'),
          getSafeQuote('BITCOIN', '⚡', 'BTC / USD', 'Bitcoin (24x7 Global)', 64250.00, 1250.00, 1.98, 'USD', '$'),
          getSafeQuote('ETHEREUM', '🔷', 'ETH / USD', 'Ethereum (24x7 Global)', 3420.00, 85.00, 2.55, 'USD', '$')
        ];

        return (
          <div className="w-full bg-[var(--bg-subnav)] border-b border-[var(--border-color)] py-2.5 px-3 sm:px-4 shadow-inner relative overflow-hidden">
            <div className="max-w-[1850px] mx-auto flex items-center justify-between gap-3 sm:gap-5">
              
              {/* Left Pinned Capsule: Market Status Badges & Controls */}
              <div className="flex items-center gap-2 shrink-0 z-20 bg-[var(--bg-subnav)] pr-3 border-r border-[var(--border-color)]">
                {/* Indian Market Status Pill */}
                <button
                  onClick={() => setActiveNavModal('market_timings')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    marketHours.india.isOpen
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                  }`}
                  title={`Indian Markets (NSE/BSE): ${marketHours.india.sessionState}. ${marketHours.india.nextSessionText}`}
                >
                  <span className={`w-2 h-2 rounded-full ${marketHours.india.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                  <span>{marketHours.india.statusText}</span>
                </button>

                {/* US Market Status Pill */}
                <button
                  onClick={() => setActiveNavModal('market_timings')}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    marketHours.us.isOpen
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                  }`}
                  title={`US Markets (NYSE/NASDAQ): ${marketHours.us.sessionState}. ${marketHours.us.nextSessionText}`}
                >
                  <span className={`w-2 h-2 rounded-full ${marketHours.us.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                  <span>{marketHours.us.statusText}</span>
                </button>

                {/* 24/7 Crypto Live Pill */}
                <span className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>CRYPTO 24/7</span>
                </span>

                {/* Manual Sync / Refresh Button */}
                <button
                  onClick={() => refreshMarketData()}
                  disabled={isMarketDataLoading}
                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                  title="Sync Latest Market Quotes"
                >
                  <RefreshCw className={`w-3 h-3 ${isMarketDataLoading ? 'animate-spin text-emerald-500' : ''}`} />
                </button>
              </div>

              {/* Right Sliding Track: Continuous Marquee with Hover-Pause */}
              <div 
                className="relative flex-1 overflow-hidden marquee-container group select-none cursor-pointer"
                onMouseEnter={() => setIsTickerPaused(true)}
                onMouseLeave={() => setIsTickerPaused(false)}
              >
                {/* Left & Right Gradient Shadows for seamless fade */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-[var(--bg-subnav)] to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[var(--bg-subnav)] to-transparent" />

                {/* Continuous Moving Track (Pauses strictly on mouse hover) */}
                <div 
                  className="animate-marquee-infinite flex items-center gap-5 whitespace-nowrap text-xs font-mono py-0.5"
                  style={isTickerPaused ? { animationPlayState: 'paused' } : undefined}
                >
                  {[...tickerQuotesList, ...tickerQuotesList].map((quote, idx) => {
                    const isPositive = quote.change >= 0;
                    return (
                      <div
                        key={`${quote.symbol}-${idx}`}
                        onClick={() => setActiveNavModal('market_timings')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--groww-emerald)] shadow-xs transition-all cursor-pointer shrink-0 hover:scale-105"
                        title={`${quote.name} • Last session: ${quote.lastUpdated}. Click to view exchange hours.`}
                      >
                        <span className="text-xs">{quote.icon}</span>
                        <span className="font-bold text-[var(--text-secondary)] font-sans text-[11px]">{quote.symbol}</span>
                        <span className="font-extrabold text-[var(--text-primary)]">
                          {quote.currencySymbol}{quote.price.toLocaleString(quote.currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`font-bold flex items-center text-[10px] px-1.5 py-0.5 rounded-md ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                          {isPositive ? `+${quote.changePct}%` : `${quote.changePct}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 3. HERO & GROWW-INSPIRED DYNAMIC CATEGORY EXPLORER */}
      {/* ========================================================================= */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex flex-col justify-center">
        {/* Groww-Style Quick Category Filter Navbar */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {[
            { id: 'All', label: '✨ All Assets' },
            { id: 'Stocks', label: '📈 Stocks & ETFs' },
            { id: 'F&O', label: '⚡ Futures & Options' },
            { id: 'Mutual Funds', label: '🌱 Direct Mutual Funds' },
            { id: 'Money Market', label: '🏛️ Money Market & T-Bills' },
            { id: 'Gold', label: '🪙 Sovereign Gold SGB' },
            { id: 'FD', label: '🔒 Corporate FDs' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => {
                setActiveCategoryPill(pill.id);
                if (pill.id === 'Money Market') {
                  setSelectedCategory('All');
                } else if (pill.id === 'Gold') {
                  setSelectedCategory('Gold & SGB');
                } else if (pill.id === 'FD') {
                  setSelectedCategory('Commercial Paper');
                }
              }}
              className={`groww-pill border transition-all cursor-pointer ${
                activeCategoryPill === pill.id
                  ? 'bg-[var(--groww-emerald)] text-slate-950 border-[var(--groww-emerald)] shadow-md shadow-emerald-500/20 font-black scale-105'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--groww-emerald)] font-bold hover:text-[var(--text-primary)]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT COLUMN: DYNAMIC CATEGORY SPOTLIGHT & VALUE PROPOSITION (7 Cols) */}
          <div className="lg:col-span-7 space-y-7 animate-in fade-in duration-300">
            {(() => {
              const currentCategory = CATEGORY_SHOWCASE[activeCategoryPill] || CATEGORY_SHOWCASE.All;
              return (
                <>
                  {/* Category Value Proposition & Tagline */}
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[var(--groww-emerald)] border border-emerald-500/20 text-xs font-bold tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{currentCategory.badge}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
                      {currentCategory.title} <br />
                      <span className="groww-gradient-text font-black">
                        {currentCategory.highlightText}
                      </span>
                    </h1>

                    <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                      {currentCategory.description}
                    </p>

                    {/* Category Key Stat Metric Badges */}
                    <div className="grid grid-cols-3 gap-3 pt-1 max-w-xl">
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">{currentCategory.stat1.label}</span>
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{currentCategory.stat1.value}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">{currentCategory.stat2.label}</span>
                        <span className="text-sm sm:text-base font-black text-[var(--text-primary)] font-mono mt-0.5 block">{currentCategory.stat2.value}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">{currentCategory.stat3.label}</span>
                        <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">{currentCategory.stat3.value}</span>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC ASSET SPOTLIGHT CARDS DECK (Active when specific category selected) */}
                  {activeCategoryPill !== 'All' ? (
                    <div className="space-y-3.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Featured {activeCategoryPill} Instruments & Strategies</span>
                        </span>
                        <button
                          onClick={() => setActiveCategoryPill('All')}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          ← View All Categories
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {currentCategory.items.map(item => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div>
                                  <h4 className="text-xs font-black text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {item.name}
                                  </h4>
                                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{item.tickerOrIssuer}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                  {item.tag}
                                </span>
                              </div>

                              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed my-2">
                                {item.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2 mt-2">
                              <div>
                                <span className="text-[9px] text-[var(--text-muted)] block uppercase">{item.metricLabel}</span>
                                <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                                  {item.metricValue}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  if (item.categoryType === 'money_market') {
                                    const match = MONEY_MARKET_CATALOG.find(m => m.id === item.id) || MONEY_MARKET_CATALOG[0];
                                    setActiveInstrumentModal(match);
                                  } else if (item.categoryType === 'fd') {
                                    setActiveNavModal('pricing');
                                  } else {
                                    loginDemoUser(item.categoryType === 'fno' ? 'Institutional Prime' : 'Retail HNI');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-[11px] hover:bg-[var(--groww-emerald-hover)] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>{item.actionText}</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Category Action Footer */}
                      <div className="p-3.5 rounded-2xl bg-[var(--bg-subnav)] border border-[var(--border-color)] flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--text-secondary)] font-medium">
                          Explore all 500+ instruments with instant ₹10L paper trading cash.
                        </span>
                        <button
                          onClick={() => loginDemoUser('Sandbox Demo')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer shrink-0"
                        >
                          Launch Terminal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Beginner-Friendly Interactive Guide Section */}
                      <div className="groww-card p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                              💡
                            </div>
                            <div>
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                                New to Quant Trading? Fast Track Guide
                              </h3>
                              <p className="text-[11px] text-[var(--text-muted)]">Click a topic below to explore</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl text-xs font-bold">
                            <button
                              onClick={() => setActiveGuideTab('mpt')}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                activeGuideTab === 'mpt' ? 'bg-[var(--bg-card)] text-emerald-600 shadow-xs font-black' : 'text-[var(--text-muted)]'
                              }`}
                            >
                              1. MPT Theory
                            </button>
                            <button
                              onClick={() => setActiveGuideTab('safe')}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                activeGuideTab === 'safe' ? 'bg-[var(--bg-card)] text-emerald-600 shadow-xs font-black' : 'text-[var(--text-muted)]'
                              }`}
                            >
                              2. 100% Safe Shield
                            </button>
                            <button
                              onClick={() => setActiveGuideTab('algo')}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                activeGuideTab === 'algo' ? 'bg-[var(--bg-card)] text-blue-600 shadow-xs font-black' : 'text-[var(--text-muted)]'
                              }`}
                            >
                              3. F&O Backtest
                            </button>
                          </div>
                        </div>

                        {/* Guide Content Display */}
                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                          {activeGuideTab === 'mpt' && (
                            <div className="flex items-start gap-3.5">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                                <BarChart3 className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-primary)] text-sm">Markowitz Modern Portfolio Theory (MPT)</span>
                                <p>
                                  Nobel-prize winning mathematics that balances your portfolio across uncorrelated assets (NIFTY 50 bluechips, US Tech, Gold, Bonds). It optimizes weight allocations to maximize your Sharpe Ratio and minimize maximum drawdown.
                                </p>
                              </div>
                            </div>
                          )}

                          {activeGuideTab === 'safe' && (
                            <div className="flex items-start gap-3.5">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-primary)] text-sm">100% Capital-Protected Safe Investment Engine</span>
                                <p>
                                  Zero market risk. Allocates 100% into RBI-guaranteed Sovereign Gold Bonds (SGBs), Central Government G-Secs yielding 7.2%+, and Scheduled Bank Fixed Deposits. Guaranteed wealth compounding without any stock market volatility.
                                </p>
                              </div>
                            </div>
                          )}

                          {activeGuideTab === 'algo' && (
                            <div className="flex items-start gap-3.5">
                              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                                <LineChart className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-primary)] text-sm">Simulated Derivatives & Options Strategy Backtester</span>
                                <p>
                                  Test Iron Condors, Straddles, and Bull Call Spreads against 5 years of historical tick-by-tick market data. Evaluate win rate, profit factor, and max loss before risking a single rupee.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Persona Logins */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                            ⚡ 1-Click Fast Sandbox Personas (Select to Enter Instantly):
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">No Password Needed</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div
                            onClick={() => loginDemoUser('Institutional Prime')}
                            className="groww-card p-4 rounded-2xl bg-[var(--bg-card)] cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors">
                                  Institutional Prime
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/15 text-emerald-600">
                                  4x DMA
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)]">₹25L Portfolio with Markowitz Optimization & Risk Parity Engine.</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-emerald-600">
                              <span>Enter as Alpha Desk</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>

                          <div
                            onClick={() => loginDemoUser('Retail HNI')}
                            className="groww-card p-4 rounded-2xl bg-[var(--bg-card)] cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors">
                                  Retail HNI Investor
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/15 text-emerald-600">
                                  Balanced
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)]">₹10L Balanced Portfolio with Nifty 50 Bluechips & Sovereign Gold.</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-emerald-600">
                              <span>Enter as HNI Investor</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>

                          <div
                            onClick={() => loginDemoUser('Sandbox Demo')}
                            className="groww-card p-4 rounded-2xl bg-[var(--bg-card)] cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">
                                  Beginner Sandbox
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/15 text-blue-600">
                                  ₹10L Virtual
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)]">Fresh virtual demo account for learning and placing paper trades.</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-blue-600">
                              <span>Enter Sandbox</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {/* RIGHT COLUMN: KITE & GROWW AUTH CARD (5 Cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--groww-emerald)] text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                      SX
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">
                      Kite Login Gateway
                    </span>
                  </div>

                  <div className="flex items-center bg-[var(--bg-tertiary)] p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => { setAuthMode('login'); setLoginStep(1); setLoginError(''); }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-[var(--bg-card)] text-emerald-600 shadow-xs font-black'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setSignupStep(1); setLoginError(''); }}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        authMode === 'signup'
                          ? 'bg-[var(--bg-card)] text-emerald-600 shadow-xs font-black'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Open Account
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              {/* LOGIN MODE */}
              {authMode === 'login' && (
                <>
                  {loginStep === 1 && (
                    <form onSubmit={handleLoginStep1Submit} className="space-y-4 animate-in fade-in duration-150">
                      <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)]">Login to SanchayX</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Enter your Client User ID or Registered Mobile number</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-primary)]">User ID / Mobile</label>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5" />
                          <input
                            type="text"
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="e.g. 8512437145"
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-[var(--text-primary)]">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              alert("Password reset OTP sent to registered email trader@sanchayx.io. Use default password 'SanchayX@2026' or 1-Click Demo.");
                            }}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-10 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                          />
                          <span className="text-[var(--text-secondary)] font-medium">Remember User ID</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-[var(--groww-emerald)] hover:bg-[var(--groww-emerald-hover)] text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>CONTINUE TO 2FA PIN</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {loginStep === 2 && (
                    <form onSubmit={handleLoginStep2Submit} className="space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-black text-[var(--text-primary)]">2-Factor Authentication</h2>
                          <p className="text-xs text-[var(--text-muted)] mt-1">Enter your 6-digit Kite App PIN or TOTP</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLoginStep(1)}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          Change ID
                        </button>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--groww-emerald)] text-slate-950 font-black text-xs flex items-center justify-center">
                          SX
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-[var(--text-primary)]">SanchayX Trader</div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)]">Client ID: {userId}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-primary)] text-center block">
                          Enter 6-Digit Security PIN
                        </label>
                        <div className="flex items-center justify-center gap-2">
                          {pinDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`pin-input-${idx}`}
                              type="password"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handlePinChange(idx, e.target.value)}
                              onKeyDown={(e) => handlePinKeyDown(idx, e)}
                              className="w-10 h-12 text-center text-lg font-mono font-black rounded-xl bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] focus:border-[var(--groww-emerald)] focus:outline-none text-[var(--text-primary)]"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto pt-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleKeypadPress(num)}
                            className="py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPinDigits(['', '', '', '', '', ''])}
                          className="py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-rose-500/10 text-[10px] font-bold text-rose-500 border border-[var(--border-color)] cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeypadPress('0')}
                          className="py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-color)] cursor-pointer"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handleKeypadBackspace}
                          className="py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-xs font-bold text-[var(--text-muted)] border border-[var(--border-color)] cursor-pointer"
                        >
                          ⌫
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-3 rounded-xl bg-[var(--groww-emerald)] hover:bg-[var(--groww-emerald-hover)] text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isAuthenticating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>AUTHENTICATING OS...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>AUTHORIZE & ENTER TERMINAL</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* SIGNUP MODE */}
              {authMode === 'signup' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 text-xs font-bold">
                    <span className={signupStep === 1 ? 'text-emerald-600 font-black' : 'text-[var(--text-muted)]'}>1. Basics</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className={signupStep === 2 ? 'text-emerald-600 font-black' : 'text-[var(--text-muted)]'}>2. Segments</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className={signupStep === 3 ? 'text-emerald-600 font-black' : 'text-[var(--text-muted)]'}>3. PIN Setup</span>
                  </div>

                  {signupStep === 1 && (
                    <form onSubmit={handleSignupStep1} className="space-y-3.5">
                      <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)]">Open a Demat Account</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Start investing with zero brokerage in 3 minutes</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-primary)]">Full Legal Name</label>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-10 pr-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-primary)]">Mobile Number</label>
                        <div className="relative flex items-center">
                          <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5" />
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-10 pr-3 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-primary)]">Email Address</label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5" />
                          <input
                            type="email"
                            required
                            placeholder="rahul@investor.in"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 pl-10 pr-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[var(--groww-emerald)] hover:bg-[var(--groww-emerald-hover)] text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <span>NEXT: SELECT SEGMENTS</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {signupStep === 2 && (
                    <form onSubmit={handleSignupStep2} className="space-y-3.5">
                      <div>
                        <h2 className="text-lg font-black text-[var(--text-primary)]">Select Trading Segments</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Activate segments for your new Demat account</p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: 'Equity Delivery', label: 'NSE/BSE Equity Delivery', desc: '₹0 Brokerage on Stocks & ETFs', badge: 'FREE' },
                          { id: 'Smart 100% Safe Shield', label: '100% Safe Guaranteed Shield', desc: 'Sovereign Gold Bonds & RBI G-Secs', badge: 'ZERO RISK' },
                          { id: 'Mutual Funds', label: 'Direct Mutual Funds', desc: '0% Commission Direct SIPs', badge: '0% COMM' },
                          { id: 'F&O Derivatives', label: 'Futures & Options (F&O)', desc: 'Flat ₹20/trade on Nifty & BankNifty', badge: '₹20 FLAT' }
                        ].map(seg => {
                          const isSelected = signupSegments.includes(seg.id);
                          return (
                            <div
                              key={seg.id}
                              onClick={() => toggleSegment(seg.id)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-[var(--groww-emerald)] text-[var(--text-primary)]'
                                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-[var(--groww-emerald)] text-slate-950' : 'border border-[var(--border-color)]'
                                }`}>
                                  {isSelected && '✓'}
                                </div>
                                <div>
                                  <div className="font-bold text-[var(--text-primary)]">{seg.label}</div>
                                  <div className="text-[10px] text-[var(--text-muted)]">{seg.desc}</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                                {seg.badge}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSignupStep(1)}
                          className="w-1/3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xs border border-[var(--border-color)] cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 py-2.5 rounded-xl bg-[var(--groww-emerald)] hover:bg-[var(--groww-emerald-hover)] text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>SETUP 6-DIGIT PIN</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {signupStep === 3 && (
                    <form onSubmit={handleSignupFinal} className="space-y-4">
                      <div>
                        <h2 className="text-lg font-black text-[var(--text-primary)]">Set Your 6-Digit App PIN</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Use this PIN to login to Kite & authorize trades</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Instant ₹10,00,000 Sandbox Cash Pre-Credited</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Your demat account will be provisioned immediately with full access to live market feeds and MPT algorithms.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-primary)]">Select Account Tier</label>
                        <select
                          value={signupAccountType}
                          onChange={(e) => setSignupAccountType(e.target.value as any)}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)]"
                        >
                          <option value="Retail HNI">Retail HNI (Standard Demat + MF)</option>
                          <option value="Institutional Prime">Institutional Prime (4x DMA Margin)</option>
                          <option value="Sandbox Demo">Sandbox Demo (Zero Risk Paper Trading)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-3 rounded-xl bg-[var(--groww-emerald)] hover:bg-[var(--groww-emerald-hover)] text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isAuthenticating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>CREATING DEMAT ACCOUNT...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>COMPLETE SIGNUP & OPEN TERMINAL</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SEBI Registered Simulator</span>
                </span>
                <span className="font-mono">v2.5 Direct OS</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MONEY MARKET INSTRUMENTS SEARCH ENGINE */}
      {/* ========================================================================= */}
      <section className="w-full bg-[var(--bg-tertiary)]/50 border-y border-[var(--border-color)] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1700px] mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[var(--groww-emerald)] text-xs font-black uppercase tracking-wider">
              <CircleDollarSign className="w-3.5 h-3.5" />
              <span>Money Market Search Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              Explore Money Market Instruments & Fixed Income
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Instant yields, sovereign ratings, and zero-risk Treasury Bills, Certificates of Deposit, Commercial Papers, and Liquid Funds.
            </p>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by instrument name, issuer (e.g. RBI, HDFC, T-Bill, Sovereign Gold, Commercial Paper)..."
                value={moneyMarketSearch}
                onChange={(e) => setMoneyMarketSearch(e.target.value)}
                className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] focus:border-[var(--groww-emerald)] rounded-2xl py-3.5 pl-12 pr-10 text-xs sm:text-sm font-bold text-[var(--text-primary)] shadow-md focus:outline-none transition-colors"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              {moneyMarketSearch && (
                <button
                  onClick={() => setMoneyMarketSearch('')}
                  className="absolute right-4 top-3.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {[
                'All',
                'T-Bills',
                'Certificates of Deposit',
                'Commercial Paper',
                'G-Secs & Repo',
                'Gold & SGB',
                'Liquid Funds'
              ].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[var(--groww-emerald)] text-slate-950 shadow-sm font-black'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-emerald-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Instruments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMoneyMarketInstruments.map(item => (
              <div
                key={item.id}
                onClick={() => setActiveInstrumentModal(item)}
                className="groww-card p-5 rounded-2xl bg-[var(--bg-card)] cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-[var(--groww-emerald)] font-mono">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-black text-[var(--text-primary)] mt-1.5 group-hover:text-emerald-500 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)]">{item.issuer}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-emerald-600 dark:text-[var(--groww-emerald)] font-mono">
                        {item.yieldRate}
                      </div>
                      <span className="text-[9px] font-bold text-[var(--text-muted)]">Indicative Yield</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tenure: {item.tenure}</span>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 dark:text-[var(--groww-emerald)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredMoneyMarketInstruments.length === 0 && (
            <div className="text-center py-10 text-xs text-[var(--text-muted)]">
              No money market instruments found matching "{moneyMarketSearch}". Try searching for T-Bills, CDs, or Gold.
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EXPANDED PLATFORM BENEFITS SECTION */}
      {/* ========================================================================= */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Why Choose SanchayX Direct</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)]">
            Built with Mathematical Edge & Capital Safety
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Discover why retail investors and institutional traders trust SanchayX for their quantitative wealth management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {/* Benefit 1 */}
          <div className="groww-card p-6 rounded-3xl bg-[var(--bg-card)] space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">ZERO DOWNSIDE RISK</span>
              <h3 className="text-base font-black text-[var(--text-primary)]">100% Capital Protection Shield</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Automated allocation to Reserve Bank of India Sovereign Gold Bonds and Central Government Securities. Experience zero loss of principal while locking in 7.2%+ annualized yields.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="groww-card p-6 rounded-3xl bg-[var(--bg-card)] space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">NOBEL PRIZE MATH</span>
              <h3 className="text-base font-black text-[var(--text-primary)]">Markowitz MPT Optimization</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Algorithmic quadratic optimizer plots 1,000+ portfolio weightings to maximize your Sharpe Ratio and balance equities against uncorrelated commodities and fixed income.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="groww-card p-6 rounded-3xl bg-[var(--bg-card)] space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">UNBEATABLE ECONOMY</span>
              <h3 className="text-base font-black text-[var(--text-primary)]">₹0 Delivery & Flat ₹20 F&O</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              No percentage commissions. Save up to ₹50,000 annually compared to traditional brokers on stock delivery, direct mutual funds, and options trading.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="groww-card p-6 rounded-3xl bg-[var(--bg-card)] space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">HIGH FREQUENCY CORE</span>
              <h3 className="text-base font-black text-[var(--text-primary)]">Sub-Millisecond Execution</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Powered by IndexedDB and pure client-side Web Workers. Run historical tick backtests, Monte Carlo simulations, and order book analysis with zero lag.
            </p>
          </div>

          {/* Benefit 5 */}
          <div className="groww-card p-6 rounded-3xl bg-[var(--bg-card)] space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">24/7 COPILOT</span>
              <h3 className="text-base font-black text-[var(--text-primary)]">AI Quantitative Copilot</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Ask natural language questions about NIFTY stocks, technical indicators, balance sheet ratios, and market correlations directly inside your trading terminal.
            </p>
          </div>

          {/* Benefit 6 */}
          <div className="groww-card p-6 rounded-3xl bg-[var(--bg-card)] space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">CROSS ASSET ALPHA</span>
              <h3 className="text-base font-black text-[var(--text-primary)]">Multi-Asset Rebalancing</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              One-click rebalancing across Indian Equities, S&P 500 Global Tech, RBI Sovereign Gold, and Money Market Instruments to maintain target risk parity.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. USER TESTIMONIALS SLIDER SECTION (JUST ABOVE FOOTER) */}
      {/* ========================================================================= */}
      <section className="w-full bg-[var(--bg-card)] border-t border-[var(--border-color)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1700px] mx-auto space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Verified Community Reviews</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                Loved by Quants, HNIs, and Beginners Alike
              </h2>
            </div>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevTestimonial}
                className="p-2.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--groww-emerald)] hover:text-slate-950 transition-all cursor-pointer"
                title="Previous Review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextTestimonial}
                className="p-2.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--groww-emerald)] hover:text-slate-950 transition-all cursor-pointer"
                title="Next Review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Testimonial Active Display Card */}
          <div
            onMouseEnter={() => setIsAutoPlayTestimonials(false)}
            onMouseLeave={() => setIsAutoPlayTestimonials(true)}
            className="groww-card p-8 sm:p-12 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] relative overflow-hidden transition-all"
          >
            <Quote className="w-16 h-16 text-emerald-500/10 absolute right-8 top-8 pointer-events-none" />

            <div className="space-y-6 max-w-4xl">
              {/* Rating Stars & Impact Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(TESTIMONIALS[currentTestimonialIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-[var(--groww-emerald)] border border-emerald-500/30">
                  {TESTIMONIALS[currentTestimonialIndex].metric}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 border border-blue-500/30">
                  {TESTIMONIALS[currentTestimonialIndex].badge}
                </span>
              </div>

              {/* Review Text */}
              <p className="text-base sm:text-xl text-[var(--text-primary)] font-medium leading-relaxed italic">
                "{TESTIMONIALS[currentTestimonialIndex].content}"
              </p>

              {/* User Avatar & Name */}
              <div className="flex items-center gap-3.5 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d09c] to-[#0284c7] text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                  {TESTIMONIALS[currentTestimonialIndex].avatar}
                </div>
                <div>
                  <div className="text-sm font-black text-[var(--text-primary)]">
                    {TESTIMONIALS[currentTestimonialIndex].name}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {TESTIMONIALS[currentTestimonialIndex].role}
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Indicator Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {TESTIMONIALS.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTestimonialIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentTestimonialIndex === idx ? 'w-8 bg-[var(--groww-emerald)]' : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[var(--bg-card)] border-t border-[var(--border-color)] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[var(--text-muted)]">
        <div className="max-w-[1700px] mx-auto space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--groww-emerald)] text-slate-950 flex items-center justify-center font-black text-xs">
                  SX
                </div>
                <span className="font-extrabold text-base text-[var(--text-primary)]">
                  Sanchay<span className="text-[var(--groww-emerald)]">X</span> Direct
                </span>
              </div>
              <p className="text-[11px] leading-relaxed max-w-sm">
                SanchayX Direct is an institutional quantitative research, Markowitz portfolio optimization, and money market simulated trading platform.
              </p>
              <div className="text-[11px]">
                © 2026 SanchayX Direct OS. All rights reserved.
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">Company</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => setActiveNavModal('about')} className="hover:text-emerald-500 cursor-pointer">About Us</button></li>
                <li><button onClick={() => setActiveNavModal('products')} className="hover:text-emerald-500 cursor-pointer">Products</button></li>
                <li><button onClick={() => setActiveNavModal('pricing')} className="hover:text-emerald-500 cursor-pointer">Pricing</button></li>
                <li><button onClick={() => setActiveNavModal('support')} className="hover:text-emerald-500 cursor-pointer">Support Desk</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">Support</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => setActiveNavModal('support')} className="hover:text-emerald-500 cursor-pointer">Contact Desk</button></li>
                <li><button onClick={() => setActiveNavModal('support')} className="hover:text-emerald-500 cursor-pointer">Knowledge Base</button></li>
                <li><button onClick={() => setActiveNavModal('about')} className="hover:text-emerald-500 cursor-pointer">MPT Whitepaper</button></li>
                <li><button onClick={() => setActiveNavModal('pricing')} className="hover:text-emerald-500 cursor-pointer">Brokerage Calculator</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">Account</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => { setAuthMode('signup'); setSignupStep(1); }} className="hover:text-emerald-500 cursor-pointer">Open Demat Account</button></li>
                <li><button onClick={() => loginDemoUser('Institutional Prime')} className="hover:text-emerald-500 cursor-pointer">Institutional Login</button></li>
                <li><button onClick={() => loginDemoUser('Sandbox Demo')} className="hover:text-emerald-500 cursor-pointer">Sandbox Demo</button></li>
                <li><button onClick={() => { setAuthMode('login'); setLoginStep(1); }} className="hover:text-emerald-500 cursor-pointer">Client Login</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-color)] text-[10px] leading-relaxed text-[var(--text-muted)] space-y-2">
            <p>
              SanchayX Direct: Quantitative simulated execution platform. Securities and investments in securities market are subject to market risks; read all the related documents carefully before investing.
            </p>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. MONEY MARKET INSTRUMENT DETAILS MODAL */}
      {/* ========================================================================= */}
      {activeInstrumentModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveInstrumentModal(null); }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono">
                  {activeInstrumentModal.category}
                </span>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] mt-1">{activeInstrumentModal.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{activeInstrumentModal.issuer}</p>
              </div>
              <button
                onClick={() => setActiveInstrumentModal(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs leading-relaxed">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] space-y-0.5">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Annual Yield</div>
                  <div className="text-base font-black text-emerald-600 dark:text-[var(--groww-emerald)] font-mono">
                    {activeInstrumentModal.yieldRate}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] space-y-0.5">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Safety Rating</div>
                  <div className="text-xs font-black text-[var(--text-primary)]">
                    {activeInstrumentModal.rating}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between border-b border-[var(--border-color)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Minimum Lot / Investment:</span>
                  <span className="font-bold font-mono">{activeInstrumentModal.minInvestment}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-color)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Maturity Horizon / Tenure:</span>
                  <span className="font-bold">{activeInstrumentModal.tenure}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-color)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Liquidity Profile:</span>
                  <span className="font-bold text-emerald-600">{activeInstrumentModal.liquidity}</span>
                </div>
                {activeInstrumentModal.taxBenefit && (
                  <div className="flex justify-between border-b border-[var(--border-color)] pb-1.5">
                    <span className="text-[var(--text-muted)]">Tax Treatment:</span>
                    <span className="font-bold text-blue-600">{activeInstrumentModal.taxBenefit}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] pt-1">
                {activeInstrumentModal.description}
              </p>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setActiveInstrumentModal(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveInstrumentModal(null);
                    loginDemoUser('Sandbox Demo');
                  }}
                  className="px-5 py-2 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Simulate in Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TOP NAVBAR MODALS (ABOUT, PRODUCTS, PRICING, SUPPORT) */}
      {/* ========================================================================= */}
      {activeNavModal === 'about' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveNavModal(null); }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--groww-emerald)] text-slate-950 flex items-center justify-center font-bold">
                  SX
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)]">About SanchayX Direct</h3>
                  <p className="text-xs text-[var(--text-muted)]">Democratizing hedge-fund quantitative finance</p>
                </div>
              </div>
              <button
                onClick={() => setActiveNavModal(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs leading-relaxed text-[var(--text-secondary)]">
              <div>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)] mb-2">Our Vision</h4>
                <p>
                  SanchayX was built to bridge the gap between complex quantitative hedge fund mathematics and retail everyday investors. Just as Zerodha revolutionized discount brokerage and Groww simplified investing in India, SanchayX revolutionizes mathematical portfolio optimization.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] space-y-1.5 border border-[var(--border-color)]">
                  <div className="font-extrabold text-[var(--text-primary)]">🎯 100% Free Equity Delivery</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Zero brokerage on all long-term wealth investments, stocks, and direct mutual funds.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] space-y-1.5 border border-[var(--border-color)]">
                  <div className="font-extrabold text-[var(--text-primary)]">🛡️ DualShield Engine</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Automated risk parity balancing equities against zero-risk sovereign gold and RBI bonds.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => { setActiveNavModal(null); loginDemoUser('Sandbox Demo'); }}
                  className="px-5 py-2.5 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Try in Sandbox Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeNavModal === 'products' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveNavModal(null); }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">SanchayX Products & Platforms</h3>
                <p className="text-xs text-[var(--text-muted)]">Flagship modules available in the terminal</p>
              </div>
              <button
                onClick={() => setActiveNavModal(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {[
                { title: 'Executive Portfolio Dashboard', desc: 'Real-time Markowitz risk metrics, KRI gauges, asset breakdown, and cumulative performance charts.', icon: BarChart3, badge: 'CORE TERMINAL' },
                { title: 'DualShield Smart Investment Engine', desc: 'Automated portfolio balancing that couples aggressive equity alpha with guaranteed sovereign yields.', icon: Sparkles, badge: 'SMART CORE' },
                { title: '100% Safe Investment Engine', desc: 'Zero principal risk module allocating 100% into RBI Sovereign Gold Bonds, G-Secs, and Scheduled Bank FDs.', icon: ShieldCheck, badge: '100% SAFE' },
                { title: 'Efficient Frontier & MPT Optimizer', desc: 'Generates optimal capital weightings to maximize Sharpe Ratio or minimize portfolio variance.', icon: LineChart, badge: 'MATH ENGINE' },
                { title: 'F&O Derivatives Strategy Backtester', desc: 'Simulate option spreads, straddles, and algorithmic rebalancing against 5+ years of historical data.', icon: Zap, badge: 'ALGO SUITE' },
                { title: 'Money Market Instruments Lake', desc: 'Searchable master list of Indian Treasury Bills, CDs, Commercial Papers, and Liquid Funds.', icon: CircleDollarSign, badge: 'FIXED INCOME' }
              ].map((prod, idx) => {
                const Icon = prod.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-[var(--text-primary)]">{prod.title}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[var(--bg-card)] text-emerald-600 border border-emerald-500/20">
                          {prod.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{prod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex justify-end">
              <button
                onClick={() => { setActiveNavModal(null); loginDemoUser('Institutional Prime'); }}
                className="px-5 py-2 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Open Terminal & Explore
              </button>
            </div>
          </div>
        </div>
      )}

      {activeNavModal === 'pricing' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveNavModal(null); }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">Transparent Pricing & Calculator</h3>
                <p className="text-xs text-[var(--text-muted)]">No hidden charges or surprise account fees</p>
              </div>
              <button
                onClick={() => setActiveNavModal(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-2xl font-black text-emerald-600 font-mono">₹0</div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Equity Delivery</div>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-2xl font-black text-emerald-600 font-mono">₹20</div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Intraday & F&O</div>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-2xl font-black text-emerald-600 font-mono">0%</div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Direct MF</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-xs text-[var(--text-primary)]">
                    Brokerage Savings vs Traditional Brokers (0.5%)
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Trades per Month:</span>
                      <span className="font-mono text-emerald-600">{calcTrades} trades</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={calcTrades}
                      onChange={(e) => setCalcTrades(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Average Turnover per Trade:</span>
                      <span className="font-mono text-emerald-600">₹{calcTurnover.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={10000}
                      max={2000000}
                      step={10000}
                      value={calcTurnover}
                      onChange={(e) => setCalcTurnover(Number(e.target.value))}
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[11px] text-[var(--text-muted)]">Estimated Annual Brokerage Savings:</div>
                      <div className="text-lg font-black text-emerald-600 font-mono">
                        ₹{Math.round((calcTrades * calcTurnover * 0.005 * 12) - (calcTrades * 20 * 12)).toLocaleString()} / year
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-emerald-500/10 text-emerald-600">
                      SAVED WITH SANCHAYX
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex justify-end">
              <button
                onClick={() => { setActiveNavModal(null); setAuthMode('signup'); setSignupStep(1); }}
                className="px-5 py-2 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Open Free Account
              </button>
            </div>
          </div>
        </div>
      )}

      {activeNavModal === 'support' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveNavModal(null); }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">SanchayX Support & FAQs</h3>
                <p className="text-xs text-[var(--text-muted)]">Search answers or explore trading guides</p>
              </div>
              <button
                onClick={() => setActiveNavModal(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search questions (e.g. MPT, Sharpe ratio, charges, sandbox)..."
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--groww-emerald)]"
                />
                {supportSearch && (
                  <button
                    onClick={() => setSupportSearch('')}
                    className="absolute right-3 top-3 text-xs text-[var(--text-muted)]"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-3.5 text-left text-xs font-extrabold text-[var(--text-primary)] flex items-center justify-between cursor-pointer hover:text-emerald-600"
                    >
                      <span>{faq.q}</span>
                      <span>{openFaqIndex === idx ? '−' : '+'}</span>
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] leading-relaxed bg-[var(--bg-card)]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">24/7 AI Desk available inside terminal</span>
              <button
                onClick={() => { setActiveNavModal(null); loginDemoUser('Sandbox Demo'); }}
                className="px-5 py-2 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Enter Sandbox Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MARKET HOURS & TIMINGS SCHEDULE MODAL */}
      {/* ========================================================================= */}
      {activeNavModal === 'market_timings' && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setActiveNavModal(null); }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[var(--text-primary)]">Global Market Hours & Exchange Schedules</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono">
                    REAL-TIME ENGINE
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Accurate trading hours across Indian Equities, US Tech Markets, MCX Commodities & 24/7 Crypto.
                </p>
              </div>
              <button
                onClick={() => setActiveNavModal(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs leading-relaxed">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <span>ℹ️ Authentic Market Pricing Policy:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  When equity exchanges are closed (weekends, holidays, or after-hours), SanchayX displays frozen official closing benchmark prices. Real-time tick fluctuations occur exclusively during active trading sessions or 24/7 crypto markets.
                </p>
              </div>

              {/* Exchange Schedules Grid */}
              <div className="space-y-3">
                {/* 1. NSE / BSE India */}
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--text-primary)]">🇮🇳 NSE & BSE (India)</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        marketHours.india.isOpen
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {marketHours.india.statusText}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)]">
                      {marketHours.india.currentTimeFormatted}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[var(--text-muted)] block">Pre-Market:</span>
                      <span className="font-bold font-mono">09:00 - 09:15 IST</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Normal Trading:</span>
                      <span className="font-bold font-mono text-emerald-600">09:15 - 15:30 IST</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Next Session:</span>
                      <span className="font-bold text-[var(--text-primary)]">{marketHours.india.nextSessionText}</span>
                    </div>
                  </div>
                </div>

                {/* 2. NYSE & NASDAQ USA */}
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--text-primary)]">🇺🇸 NYSE & NASDAQ (USA)</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        marketHours.us.isOpen
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {marketHours.us.statusText}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)]">
                      {marketHours.us.currentTimeFormatted}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[var(--text-muted)] block">Regular Trading:</span>
                      <span className="font-bold font-mono text-emerald-600">09:30 - 16:00 EDT</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">IST Equivalent:</span>
                      <span className="font-bold font-mono">07:00 PM - 01:30 AM IST</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Next Session:</span>
                      <span className="font-bold text-[var(--text-primary)]">{marketHours.us.nextSessionText}</span>
                    </div>
                  </div>
                </div>

                {/* 3. MCX India (Commodities) */}
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--text-primary)]">🪙 MCX Commodities (Gold & Crude)</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        marketHours.commodity.isOpen
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {marketHours.commodity.statusText}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[var(--text-muted)] block">Trading Session:</span>
                      <span className="font-bold font-mono">09:00 - 23:30 IST</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Traded Assets:</span>
                      <span className="font-bold">Gold, Silver, Crude Oil, Natural Gas</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block">Next Session:</span>
                      <span className="font-bold text-[var(--text-primary)]">{marketHours.commodity.nextSessionText}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Global Crypto (24/7) */}
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--text-primary)]">⚡ Global Cryptocurrencies (24/7/365)</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        CONTINUOUS LIVE
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Bitcoin (BTC), Ethereum (ETH), and digital asset markets operate 24 hours a day with instant continuous tick settlement.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
              <button
                onClick={() => refreshMarketData()}
                disabled={isMarketDataLoading}
                className="px-3.5 py-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMarketDataLoading ? 'animate-spin text-emerald-500' : ''}`} />
                <span>Sync Quotes</span>
              </button>

              <button
                onClick={() => { setActiveNavModal(null); loginDemoUser('Sandbox Demo'); }}
                className="px-5 py-2 rounded-xl bg-[var(--groww-emerald)] text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Open Terminal & Place Simulated Trades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

