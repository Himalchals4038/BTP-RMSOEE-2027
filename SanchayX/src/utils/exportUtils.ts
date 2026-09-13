import type { Asset, KRIMetrics, BacktestResult } from '../types/portfolio';

export function exportPortfolioToCSV(assets: Asset[], kri: KRIMetrics, backtest?: BacktestResult) {
  let csvContent = 'data:text/csv;charset=utf-8,';

  // Section 1: Portfolio Executive Overview
  csvContent += '--- SANCHAYX PORTFOLIO EXECUTIVE OVERVIEW ---\r\n';
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
  link.setAttribute('download', `SanchayX_Portfolio_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportPortfolioToPDF(assets: Asset[], kri: KRIMetrics, backtest?: BacktestResult) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const activeAssets = assets.filter(a => a.weight > 0);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SANCHAYX INSTITUTIONAL PORTFOLIO REPORT', 14, 16);

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
  doc.text('Generated by SanchayX Institutional Engine - Page 1 of 1', 14, 285);

  doc.save(`SanchayX_Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Realistic Indian Statutory Charges Engine per SEBI / Exchange regulations
 */
export function calculateStatutoryCharges(
  orderValue: number,
  action: 'BUY' | 'SELL',
  productType: string
): {
  brokerage: number;
  stt: number;
  exchangeFee: number;
  sebiFee: number;
  stampDuty: number;
  gst: number;
  totalCharges: number;
} {
  if (orderValue <= 0) {
    return { brokerage: 0, stt: 0, exchangeFee: 0, sebiFee: 0, stampDuty: 0, gst: 0, totalCharges: 0 };
  }

  // 1. Brokerage: ₹0 for Delivery (CNC); Flat ₹20 or 0.03% (whichever is lower) for Intraday MIS & F&O
  let brokerage = 0;
  if (productType.includes('CNC') || productType.includes('Delivery')) {
    brokerage = 0;
  } else if (productType.includes('MIS') || productType.includes('Intraday') || productType.includes('F&O')) {
    brokerage = Math.min(20, Number((orderValue * 0.0003).toFixed(2)));
  } else {
    // MTF
    brokerage = Math.min(20, Number((orderValue * 0.0003).toFixed(2)));
  }

  // 2. STT (Securities Transaction Tax):
  // 0.1% on delivery Buy & Sell; 0.025% on Intraday Sell; 0.0625% on Option Sell
  let stt = 0;
  if (productType.includes('CNC') || productType.includes('Delivery')) {
    stt = Number((orderValue * 0.001).toFixed(2));
  } else if (productType.includes('MIS') || productType.includes('Intraday')) {
    stt = action === 'SELL' ? Number((orderValue * 0.00025).toFixed(2)) : 0;
  } else if (productType.includes('F&O')) {
    stt = action === 'SELL' ? Number((orderValue * 0.000625).toFixed(2)) : 0;
  } else {
    stt = Number((orderValue * 0.001).toFixed(2));
  }

  // 3. Exchange Turnover Charges: 0.00345% on NSE
  const exchangeFee = Number((orderValue * 0.0000345).toFixed(2));

  // 4. SEBI Turnover Charges: ₹10 per crore (0.0001%)
  const sebiFee = Number((orderValue * 0.000001).toFixed(2));

  // 5. Stamp Duty: 0.015% on Delivery Buy; 0.003% on Intraday Buy (charged on Buy only)
  let stampDuty = 0;
  if (action === 'BUY') {
    if (productType.includes('CNC') || productType.includes('Delivery')) {
      stampDuty = Number((orderValue * 0.00015).toFixed(2));
    } else {
      stampDuty = Number((orderValue * 0.00003).toFixed(2));
    }
  }

  // 6. GST (18% on Brokerage + Exchange Fee + SEBI Fee)
  const gstBase = brokerage + exchangeFee + sebiFee;
  const gst = Number((gstBase * 0.18).toFixed(2));

  const totalCharges = Number((brokerage + stt + exchangeFee + sebiFee + stampDuty + gst).toFixed(2));

  return {
    brokerage,
    stt,
    exchangeFee,
    sebiFee,
    stampDuty,
    gst,
    totalCharges
  };
}

/**
 * Generates an official, institutional SEBI Digital Electronic Contract Note PDF
 */
export async function exportContractNotePDF(trade: {
  id: string;
  orderId: string;
  time: string;
  ticker: string;
  name: string;
  action: 'BUY' | 'SELL';
  product: string;
  qty: number;
  price: number;
  charges: {
    brokerage: number;
    stt: number;
    exchangeFee: number;
    sebiFee: number;
    stampDuty: number;
    gst: number;
    totalCharges: number;
  };
  netValue: number;
}, user: {
  name: string;
  id: string;
  dpId?: string;
  email?: string;
}) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(249, 115, 22); // Orange
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SANCHAYX DIRECT SECURITIES SIMULATION TERMINAL', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text('OFFICIAL ELECTRONIC CONTRACT NOTE / TRADE CONFIRMATION', 14, 23);
  doc.text(`SEBI Regn. No: INZ000031633 | CIN: U67120KA2015PTC082390 | NSE Member Code: 90214`, 14, 30);

  // Contract Details Header Box
  let y = 46;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRACT NOTE SUMMARY', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Trade Ref ID: ${trade.id}`, 20, y + 16);
  doc.text(`Order ID: ${trade.orderId}`, 20, y + 23);
  doc.text(`Trade Timestamp: ${trade.time}`, 20, y + 30);

  doc.text(`Client Code: ${user.id}`, 110, y + 16);
  doc.text(`Client Name: ${user.name}`, 110, y + 23);
  doc.text(`Demat DP ID: ${user.dpId || '1208160009482100'} (CDSL Settled)`, 110, y + 30);

  // Trade Details Table
  y += 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ORDER & EXECUTION BREAKDOWN', 14, y);

  y += 5;
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('Order Ref', 18, y + 5);
  doc.text('Instrument / ISIN', 52, y + 5);
  doc.text('Action', 110, y + 5);
  doc.text('Product', 128, y + 5);
  doc.text('Qty', 155, y + 5);
  doc.text('Gross Price (₹)', 170, y + 5);

  y += 7;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(trade.orderId, 18, y + 6);
  doc.text(`${trade.ticker} (${trade.name.substring(0, 20)})`, 52, y + 6);
  doc.text(trade.action, 110, y + 6);
  doc.text(trade.product, 128, y + 6);
  doc.text(String(trade.qty), 155, y + 6);
  doc.text(`₹${trade.price.toLocaleString('en-IN')}`, 170, y + 6);

  // Gross Order Value
  const grossValue = trade.qty * trade.price;
  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Gross Trade Turnover:', 110, y);
  doc.text(`₹${grossValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 165, y);

  // Statutory Charges Breakdown
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STATUTORY REGULATORY & BROKERAGE LEVIES (OFFICIAL)', 14, y);

  y += 5;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 54, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const chargesList = [
    { label: 'Brokerage (Zero for Delivery, Flat ₹20 / 0.03% max for Intraday):', val: trade.charges.brokerage },
    { label: 'Securities Transaction Tax (STT / CTT):', val: trade.charges.stt },
    { label: 'Exchange Turnover Charges (NSE / BSE):', val: trade.charges.exchangeFee },
    { label: 'SEBI Regulatory Turnover Fee (₹10 / Crore):', val: trade.charges.sebiFee },
    { label: 'Govt of India Stamp Duty:', val: trade.charges.stampDuty },
    { label: 'Goods & Services Tax (GST @ 18% on Brokerage + Exch + SEBI):', val: trade.charges.gst }
  ];

  let cy = y + 7;
  chargesList.forEach(item => {
    doc.text(item.label, 20, cy);
    doc.text(`₹${item.val.toFixed(2)}`, 165, cy);
    cy += 7;
  });

  doc.setLineWidth(0.3);
  doc.line(20, cy - 2, 190, cy - 2);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Total Taxes, Levies & Brokerage:', 20, cy + 3);
  doc.text(`₹${trade.charges.totalCharges.toFixed(2)}`, 165, cy + 3);

  // Net Amount Box
  y = cy + 14;
  doc.setFillColor(249, 115, 22);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(trade.action === 'BUY' ? 'NET PAYABLE AMOUNT (DEBITED FROM TRADING CASH):' : 'NET RECEIVABLE AMOUNT (CREDITED TO TRADING CASH):', 20, y + 10);
  doc.setFontSize(12);
  doc.text(`₹${trade.netValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 150, y + 10);

  // Footer & Declarations
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is an authenticated computer-generated institutional contract note generated by SanchayX Direct Quantitative OS.', 14, 275);
  doc.text('Complies with Chapter IV of SEBI (Stock Brokers) Regulations, 1992 and Byelaws of National Stock Exchange of India Ltd.', 14, 280);

  doc.save(`SanchayX_ContractNote_${trade.id}.pdf`);
}

/**
 * Generates an official Form 15G / 15H Section 197A Non-Deduction Declaration PDF
 */
export async function exportForm15DeclarationPDF(data: {
  formType: 'Form 15G' | 'Form 15H';
  declarantName: string;
  pan: string;
  status: string;
  financialYear: string;
  residentialStatus: string;
  estimatedTotalIncome: number;
  interestIncome: number;
  numberOfForms: number;
  aggregateAmount: number;
  bondOrFdName: string;
  taxSavedEstimate: number;
}) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${data.formType.toUpperCase()} — INCOME TAX RULES, 1962`, 14, 14);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Declaration under Section 197A(1)/(1C) of Income Tax Act for Nil Deduction of TDS`, 14, 22);
  doc.text(`SanchayX Zero-TDS Family Wealth Structuring Engine | FY ${data.financialYear}`, 14, 28);

  // Declarant Box
  let y = 40;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 58, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('PART I: PARTICULARS OF DECLARANT', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`1. Name of Declarant: ${data.declarantName}`, 20, y + 17);
  doc.text(`2. Permanent Account Number (PAN): ${data.pan}`, 20, y + 25);
  doc.text(`3. Status: ${data.status}`, 20, y + 33);
  doc.text(`4. Residential Status: ${data.residentialStatus}`, 20, y + 41);
  doc.text(`5. Relevant Assessment Year: 2026-2027`, 20, y + 49);

  doc.text(`6. Eligible Scheme: Fixed Income / NCD / FD`, 110, y + 17);
  doc.text(`7. Estimated Total Income: ₹${data.estimatedTotalIncome.toLocaleString('en-IN')}`, 110, y + 25);
  doc.text(`8. Interest Income Declared: ₹${data.interestIncome.toLocaleString('en-IN')}`, 110, y + 33);
  doc.text(`9. Tax Slabs: 0% Nil Income Slab`, 110, y + 41);
  doc.text(`10. Net Annual TDS Saved: ₹${data.taxSavedEstimate.toLocaleString('en-IN')}`, 110, y + 49);

  // Details of Securities
  y += 68;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PART II: PARTICULARS OF INVESTMENTS / SECURITIES FOR ZERO-TDS BENEFIT', 14, y);

  y += 5;
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Securities Description', 18, y + 5);
  doc.text('Identification / ISIN', 80, y + 5);
  doc.text('Invested Amount', 130, y + 5);
  doc.text('Declared Interest Rate', 165, y + 5);

  y += 7;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.bondOrFdName, 18, y + 6);
  doc.text('INE948210984 (BSE/NSE)', 80, y + 6);
  doc.text(`₹${data.aggregateAmount.toLocaleString('en-IN')}`, 130, y + 6);
  doc.text('8.80% - 11.20% p.a.', 165, y + 6);

  // Verification & Declaration Text
  y += 18;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 45, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DECLARATION / VERIFICATION', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `*I/We ${data.declarantName} do hereby declare that to the best of my knowledge and belief what is stated above is correct, complete and is truly stated. I declare that the incomes referred to in this form are not includible in the total income of any other person under sections 60 to 64 of the Income-tax Act, 1961.`,
    20,
    y + 16,
    { maxWidth: 170 }
  );

  doc.text(
    `I further declare that the tax on my estimated total income including the income referred to above computed in accordance with the provisions of the Income-tax Act, 1961, for the previous year relevant to the assessment year 2026-2027 will be NIL.`,
    20,
    y + 28,
    { maxWidth: 170 }
  );

  // Signature lines
  y += 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Place: Kolkata / Online`, 20, y);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, y + 7);

  doc.text(`Signature of Declarant: [ Digitally Signed via SanchayX PAN Gateway ]`, 95, y);
  doc.text(`PAN: ${data.pan}`, 95, y + 7);

  doc.save(`SanchayX_${data.formType.replace(' ', '_')}_${data.pan}.pdf`);
}
