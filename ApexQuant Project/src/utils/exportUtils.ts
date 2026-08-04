import jsPDF from 'jspdf';
import type { Asset, KRIMetrics, BacktestResult } from '../types/portfolio';

export function exportPortfolioToCSV(assets: Asset[], kri: KRIMetrics, backtest?: BacktestResult) {
  let csvContent = 'data:text/csv;charset=utf-8,';

  // Section 1: Portfolio Executive Overview
  csvContent += '--- APEXQUANT PORTFOLIO EXECUTIVE OVERVIEW ---\r\n';
  csvContent += `Total Portfolio Value,${kri.totalValue}\r\n`;
  csvContent += `24h Gain Loss ($),${kri.totalGainLoss24h}\r\n`;
  csvContent += `24h Gain Loss (%),${kri.totalGainLoss24hPct}%\r\n`;
  csvContent += `Sharpe Ratio,${kri.sharpeRatio}\r\n`;
  csvContent += `Sortino Ratio,${kri.sortinoRatio}\r\n`;
  csvContent += `VaR 95% Historical,${kri.var95Historical}%\r\n`;
  csvContent += `VaR 95% Parametric,${kri.var95Parametric}%\r\n`;
  csvContent += `Maximum Drawdown,${kri.maxDrawdown}%\r\n`;
  csvContent += `Portfolio Beta,${kri.portfolioBeta}\r\n`;
  csvContent += `Portfolio Alpha,${kri.portfolioAlpha}%\r\n\r\n`;

  // Section 2: Asset Weights
  csvContent += '--- ASSET ALLOCATION BREAKDOWN ---\r\n';
  csvContent += 'Ticker,Name,Category,Market,Price,24h Change (%),Annualized Return (%),Annualized Vol (%),Weight (%)\r\n';
  assets.forEach(a => {
    csvContent += `"${a.ticker}","${a.name}","${a.category}","${a.market}",${a.price},${a.change24h}%,${a.annualizedReturn}%,${a.annualizedVol}%,${a.weight}%\r\n`;
  });

  // Section 3: Backtest Log (if available)
  if (backtest && backtest.trades.length > 0) {
    csvContent += '\r\n--- REBALANCE TRADE LOG ---\r\n';
    csvContent += 'Date,Asset Ticker,Asset Name,Action,Amount,Target Weight (%),Drift Weight (%),Estimated Cost\r\n';
    backtest.trades.forEach(t => {
      csvContent += `"${t.date}","${t.assetTicker}","${t.assetName}","${t.action}",${t.amount},${t.targetWeight}%,${t.driftWeight}%,${t.estimatedCost}\r\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ApexQuant_Portfolio_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPortfolioToPDF(assets: Asset[], kri: KRIMetrics, backtest?: BacktestResult) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const activeAssets = assets.filter(a => a.weight > 0);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('APEXQUANT INSTITUTIONAL PORTFOLIO REPORT', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Multi-Asset Quantitative & Risk Analysis`, 14, 25);

  let y = 45;

  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 41, 59);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 35, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Risk Indicators (KRIs)', 20, y + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Portfolio Value: $${kri.totalValue.toLocaleString()}`, 20, y + 18);
  doc.text(`Sharpe Ratio: ${kri.sharpeRatio} (${kri.evaluationBadge})`, 20, y + 25);

  doc.text(`Sortino Ratio: ${kri.sortinoRatio}`, 80, y + 18);
  doc.text(`Max Drawdown: ${kri.maxDrawdown}%`, 80, y + 25);

  doc.text(`VaR 95% Historical: ${kri.var95Historical}%`, 140, y + 18);
  doc.text(`Beta / Alpha: ${kri.portfolioBeta} / ${kri.portfolioAlpha}%`, 140, y + 25);

  y += 45;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Asset Allocation & Weights', 14, y);
  y += 8;

  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Ticker', 18, y + 5.5);
  doc.text('Asset Name', 45, y + 5.5);
  doc.text('Category', 105, y + 5.5);
  doc.text('Ann. Return', 140, y + 5.5);
  doc.text('Weight', 175, y + 5.5);

  y += 8;
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');

  activeAssets.forEach((a, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, 'F');
    }
    doc.text(a.ticker, 18, y + 5);
    doc.text(a.name.substring(0, 24), 45, y + 5);
    doc.text(a.category, 105, y + 5);
    doc.text(`${a.annualizedReturn}%`, 140, y + 5);
    doc.text(`${a.weight}%`, 175, y + 5);
    y += 7;
  });

  if (backtest) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Backtest Strategy Performance Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`CAGR: ${backtest.cagr}% (vs Benchmark ${backtest.benchmarkCagr}%)`, 14, y);
    doc.text(`Max Drawdown: ${backtest.maxDrawdown}%`, 80, y);
    doc.text(`Total Rebalances: ${backtest.totalRebalances}`, 140, y);
    y += 6;
    doc.text(`Total Invested: $${backtest.totalInvested.toLocaleString()}  --> Final Value: $${backtest.finalValue.toLocaleString()}`, 14, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by ApexQuant Institutional Engine - Page 1 of 1', 14, 285);

  doc.save(`ApexQuant_Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
