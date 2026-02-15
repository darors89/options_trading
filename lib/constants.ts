import type { Stock } from './types';

export const ARGENTINE_STOCKS: Record<string, Stock[]> = {
  Bancos: [
    { symbol: 'GGAL', name: 'Grupo Galicia', sector: 'Bancos' },
    { symbol: 'BMA', name: 'Banco Macro', sector: 'Bancos' },
    { symbol: 'SUPV', name: 'Supervielle', sector: 'Bancos' },
    { symbol: 'BBAR', name: 'BBVA Argentina', sector: 'Bancos' },
  ],
  Energía: [
    { symbol: 'YPFD', name: 'YPF', sector: 'Energía' },
    { symbol: 'PAMP', name: 'Pampa Energía', sector: 'Energía' },
    { symbol: 'TGSU2', name: 'TGS', sector: 'Energía' },
    { symbol: 'TRAN', name: 'Transener', sector: 'Energía' },
  ],
  Telecom: [
    { symbol: 'TECO2', name: 'Telecom Argentina', sector: 'Telecom' },
    { symbol: 'LEDE', name: 'Ledesma', sector: 'Telecom' },
  ],
  Industria: [
    { symbol: 'ALUA', name: 'Aluar', sector: 'Industria' },
    { symbol: 'TXAR', name: 'Ternium', sector: 'Industria' },
    { symbol: 'COME', name: 'Cresud', sector: 'Industria' },
  ],
  Utilities: [
    { symbol: 'EDN', name: 'Edenor', sector: 'Utilities' },
    { symbol: 'CECO2', name: 'Central Costanera', sector: 'Utilities' },
    { symbol: 'CEPU', name: 'Central Puerto', sector: 'Utilities' },
  ],
};

export const POPULAR_STOCKS = ['GGAL', 'YPFD', 'PAMP', 'BMA', 'ALUA', 'TECO2', 'SUPV', 'BBAR'];

export const STRATEGIES = {
  basic: ['Covered Call', 'Protective Put', 'Covered Put', 'Protective Call'],
  spreads: ['Bull Call Spread', 'Bear Put Spread', 'Bull Put Spread', 'Bear Call Spread'],
  volatility: ['Long Straddle', 'Short Straddle', 'Long Strangle', 'Short Strangle'],
  butterflies: ['Long Call Butterfly', 'Long Put Butterfly', 'Iron Butterfly'],
  condors: ['Iron Condor', 'Long Call Condor', 'Long Put Condor'],
  advanced: [
    'Jade Lizard', 'Poor Man\'s Covered Call', 'Wheel Strategy (Put)',
    'Collar', 'Call Ratio Spread', 'ZEBRA Spread'
  ],
};
