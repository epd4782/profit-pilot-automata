
// Performancedaten für das Diagramm
export const mockPerformanceData = {
  daily: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 100 + Math.random() * 10 * Math.sin(i / 3) + i * 0.5
  })),
  weekly: Array.from({ length: 7 }, (_, i) => ({
    time: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i],
    value: 100 + Math.random() * 15 * Math.sin(i / 2) + i * 1.2
  })),
  monthly: Array.from({ length: 30 }, (_, i) => ({
    time: `${i+1}`,
    value: 100 + Math.random() * 20 * Math.sin(i / 5) + i * 0.8
  })),
  yearly: Array.from({ length: 12 }, (_, i) => ({
    time: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][i],
    value: 100 + Math.random() * 30 * Math.sin(i / 3) + i * 2.5
  })),
};

// Trading-Strategien
export const mockStrategies = [
  {
    id: "smart-grid",
    name: "Smart Grid",
    description: "Automatisierte Grid-Trading-Strategie mit dynamischer Anpassung an die Marktvolatilität.",
    risk: "Mittel"
  },
  {
    id: "dca-bot",
    name: "DCA Bot",
    description: "Dollar-Cost-Averaging mit intelligenten Einstiegspunkten basierend auf technischen Indikatoren.",
    risk: "Niedrig"
  },
  {
    id: "trend-follow",
    name: "Trend Follow",
    description: "Folgt starken Markttrends mit dynamischer Positionsanpassung für maximale Gewinne.",
    risk: "Hoch"
  },
  {
    id: "arbitrage",
    name: "Arbitrage Hunter",
    description: "Identifiziert und nutzt Preisunterschiede zwischen verschiedenen Assets und Märkten.",
    risk: "Mittel"
  },
];

// Letzte Transaktionen
export const mockRecentTrades = [
  {
    time: "14:32:45",
    pair: "BTC/EUR",
    type: "buy",
    price: 52436.78,
    amount: 0.00124,
    total: 65.02,
    profit: 0
  },
  {
    time: "13:45:12",
    pair: "ETH/EUR",
    type: "sell",
    price: 2851.33,
    amount: 0.0523,
    total: 149.12,
    profit: 4.28
  },
  {
    time: "11:23:05",
    pair: "SOL/EUR",
    type: "buy",
    price: 102.45,
    amount: 0.457,
    total: 46.82,
    profit: 0
  },
  {
    time: "09:17:33",
    pair: "ADA/EUR",
    type: "sell",
    price: 0.489,
    amount: 125.76,
    total: 61.50,
    profit: -1.23
  },
  {
    time: "08:05:19",
    pair: "DOT/EUR",
    type: "buy",
    price: 6.78,
    amount: 7.125,
    total: 48.31,
    profit: 0
  },
  {
    time: "Gestern",
    pair: "BNB/EUR",
    type: "sell",
    price: 428.92,
    amount: 0.125,
    total: 53.62,
    profit: 2.87
  },
  {
    time: "Gestern",
    pair: "XRP/EUR",
    type: "buy",
    price: 0.525,
    amount: 98.25,
    total: 51.58,
    profit: 0
  }
];
