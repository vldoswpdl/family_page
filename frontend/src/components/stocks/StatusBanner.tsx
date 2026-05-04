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
    status?.apiStatus === 'IP_MISMATCH' ? '현재 외부 IP가 키움 API 등록 IP와 일치하지 않습니다.' : null,
    status?.apiStatus === 'NOT_CONFIGURED' ? '키움 API 키가 .env에 설정되어 있지 않습니다.' : null,
    status?.apiStatus === 'TOKEN_EXPIRED' ? '저장된 키움 토큰이 만료되었습니다.' : null
  ].filter((message): message is string => Boolean(message));

  if (!messages.length) {
    return <div className="stock-status-banner ok">API 상태가 정상입니다. 대시보드 데이터를 표시할 수 있습니다.</div>;
  }

  return (
    <div className="stock-status-banner warning">
      {messages.map((message) => (
        <span key={message}>{message}</span>
      ))}
    </div>
  );
}
