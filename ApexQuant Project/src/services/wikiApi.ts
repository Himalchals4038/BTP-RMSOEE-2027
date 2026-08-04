export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
  description?: string;
}

// Custom dictionary fallback entries for financial terms and specific assets
export const FINANCIAL_DICTIONARY: Record<string, { title: string; category: string; description: string; formula?: string; example: string }> = {
  'Modern Portfolio Theory': {
    title: 'Modern Portfolio Theory (MPT)',
    category: 'Quantitative Finance',
    description: 'A mathematical framework created by Harry Markowitz (1952) for constructing a portfolio of assets such that expected return is maximized for a given level of risk.',
    formula: 'E(R_p) = \\sum w_i E(R_i), \\quad \\sigma_p^2 = \\sum \\sum w_i w_j \\sigma_{ij}',
    example: 'Combining low-correlated assets like Gold and Sovereign Bonds with Equities reduces overall portfolio variance without sacrificing expected returns.'
  },
  'Sharpe Ratio': {
    title: 'Sharpe Ratio',
    category: 'Risk-Adjusted Return',
    description: 'Measures the performance of an investment compared to a risk-free asset, after adjusting for its volatility.',
    formula: 'Sharpe = \\frac{R_p - R_f}{\\sigma_p}',
    example: 'A Sharpe ratio above 1.0 is considered Good, above 1.5 Very Good, and above 2.0 Excellent.'
  },
  'Sortino Ratio': {
    title: 'Sortino Ratio',
    category: 'Risk-Adjusted Return',
    description: 'A variation of the Sharpe ratio that differentiates harmful volatility from general volatility by using the asset downside deviation rather than total standard deviation.',
    formula: 'Sortino = \\frac{R_p - R_f}{\\sigma_{downside}}',
    example: 'Ideal for evaluating asymmetric return assets like Cryptocurrencies or Growth Equities where upside spikes should not be penalized.'
  },
  'Value at Risk': {
    title: 'Value at Risk (VaR 95% / 99%)',
    category: 'Risk Management',
    description: 'A statistic that quantifies the extent of possible financial losses within a firm or portfolio over a specific time horizon.',
    formula: 'VaR_{\\alpha} = - (\\mu - z_{\\alpha} \\sigma)',
    example: 'A 1-Day 95% VaR of $10,000 means there is only a 5% chance that the portfolio will lose more than $10,000 on a single trading day.'
  },
  'High-Yield Bonds': {
    title: 'High-Yield & Speculative Corporate Debt',
    category: 'Fixed Income',
    description: 'Corporate bonds rated below investment grade (BB+ or lower by S&P/Fitch, Ba1 or lower by Moody’s) offering higher yields to compensate for default risk.',
    example: 'iShares HYG or Piramal NBFC Bonds offer 8%–12% yields compared to 4.5% Treasuries, carrying higher credit spread volatility.'
  },
  'Risk Parity': {
    title: 'Risk Parity Weighting',
    category: 'Portfolio Construction',
    description: 'An allocation strategy where capital is allocated based on equal risk contribution from each asset class rather than equal dollar amounts.',
    example: 'Ray Dalio’s All Weather Portfolio allocates higher weight to low-volatility bonds and lower weight to volatile crypto to balance total portfolio risk.'
  }
};

export async function fetchWikipediaSummary(term: string): Promise<WikiSummary | null> {
  try {
    // Map ticker/name aliases to Wikipedia friendly article names
    let queryTerm = term;
    if (term.includes('HDFC Bank')) queryTerm = 'HDFC Bank';
    else if (term.includes('Reliance Industries')) queryTerm = 'Reliance Industries';
    else if (term.includes('Apple')) queryTerm = 'Apple Inc.';
    else if (term.includes('NVIDIA')) queryTerm = 'Nvidia';
    else if (term.includes('Bitcoin')) queryTerm = 'Bitcoin';
    else if (term.includes('Ethereum')) queryTerm = 'Ethereum';
    else if (term.includes('Solana')) queryTerm = 'Solana (blockchain platform)';
    else if (term.includes('Gold')) queryTerm = 'Gold as an investment';
    else if (term.includes('Crude Oil')) queryTerm = 'Petroleum';
    else if (term.includes('High Yield')) queryTerm = 'High-yield debt';
    else if (term.includes('Sovereign G-Sec')) queryTerm = 'Government bond';

    const encodedTerm = encodeURIComponent(queryTerm);
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTerm}`);
    
    if (!response.ok) {
      // Fallback search using search query if exact title fails
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedTerm}&format=json&origin=*`);
      const searchData = await searchRes.json();
      if (searchData.query?.search?.length > 0) {
        const firstTitle = searchData.query.search[0].title;
        const fallbackRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
        if (fallbackRes.ok) return await fallbackRes.json();
      }
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Wikipedia API fetch error:', error);
    return null;
  }
}
