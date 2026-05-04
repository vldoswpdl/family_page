import { StockMode } from '../../types/stocks';

interface ModeBadgeProps {
  mode: StockMode;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  return <span className={`stock-mode-badge ${mode}`}>{mode === 'real' ? '실전 서버' : '모의 서버'}</span>;
}
