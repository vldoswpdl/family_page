import { KiwoomStatus, StockPortfolio } from '../../types/stocks';

interface StatusBannerProps {
  portfolio?: StockPortfolio | null;
  status?: KiwoomStatus | null;
  error?: string | null;
}

export function StatusBanner({ portfolio, status, error }: StatusBannerProps) {
  const messages = [
    error,
    portfolio?.warning,
    status?.apiStatus === 'IP_MISMATCH' ? 'Current external IP does not match the registered Kiwoom API IP.' : null,
    status?.apiStatus === 'NOT_CONFIGURED' ? 'Kiwoom API credentials are not configured in .env.' : null,
    status?.apiStatus === 'TOKEN_EXPIRED' ? 'Stored Kiwoom token is expired.' : null
  ].filter((message): message is string => Boolean(message));

  if (!messages.length) {
    return <div className="stock-status-banner ok">API status is ready. Dashboard data is available.</div>;
  }

  return (
    <div className="stock-status-banner warning">
      {messages.map((message) => (
        <span key={message}>{message}</span>
      ))}
    </div>
  );
}
