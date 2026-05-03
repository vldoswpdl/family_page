import { StockMode } from '../../types/stocks';

interface ModeBadgeProps {
  mode: StockMode;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  return <span className={`stock-mode-badge ${mode}`}>{mode === 'real' ? 'REAL SERVER' : 'MOCK SERVER'}</span>;
}

