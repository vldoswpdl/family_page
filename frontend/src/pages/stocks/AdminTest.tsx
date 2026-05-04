import { useEffect, useState } from 'react';
import { ModeBadge } from '../../components/stocks/ModeBadge';
import { fetchKiwoomStatus, refreshStockPortfolio, runStockTest } from '../../lib/stockApi';
import { ApiTestResult, KiwoomStatus, StockMode } from '../../types/stocks';

type TestAction = 'token' | 'account' | 'balance' | 'refresh';
const STOCK_MODE: StockMode = 'real';

export function AdminTest() {
  const [status, setStatus] = useState<KiwoomStatus | null>(null);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [running, setRunning] = useState<TestAction | null>(null);

  async function loadStatus() {
    const data = await fetchKiwoomStatus(STOCK_MODE);
    setStatus(data);
  }

  useEffect(() => {
    void loadStatus().catch(() => setStatus(null));
  }, []);

  async function execute(action: TestAction) {
    if (!window.confirm('실전 키움 서버로 테스트를 실행할까요?')) {
      return;
    }

    setRunning(action);
    setResult(null);

    try {
      const data =
        action === 'refresh' ? await refreshStockPortfolio(STOCK_MODE) : await runStockTest(action, STOCK_MODE);
      setResult(data);
      await loadStatus();
    } catch (error) {
      setResult({
        ok: false,
        errorMessage: error instanceof Error ? error.message : '테스트에 실패했습니다.'
      });
    } finally {
      setRunning(null);
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>관리자 테스트</p>
          <h1>키움 API</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">대시보드</a>
          <a href="/stocks/admin/test">API 테스트</a>
          <a href="/stocks/reports">리포트</a>
          <a href="/stocks/opinions">투자 의견</a>
        </nav>
      </header>

      <section className="stock-toolbar">
        <div className="stock-control-group">
          <ModeBadge mode={STOCK_MODE} />
          <strong className="stock-real-warning">실전 서버 테스트</strong>
        </div>
      </section>

      <section className="stock-meta-panel">
        <div>
          <span>현재 외부 IP</span>
          <strong>{status?.currentIp || '확인 불가'}</strong>
        </div>
        <div>
          <span>등록 IP</span>
          <strong>{status?.registeredIp || '설정 없음'}</strong>
        </div>
        <div>
          <span>IP 일치 여부</span>
          <strong>{status?.isIpMatched ? '일치' : '불일치'}</strong>
        </div>
        <div>
          <span>토큰</span>
          <strong>{status?.tokenStatus.exists ? (status.tokenStatus.isExpired ? '만료' : '저장됨') : '없음'}</strong>
        </div>
      </section>

      <section className="stock-panel">
        <div className="stock-section-title">
          <div>
            <span>안전 테스트 패널</span>
            <h2>백엔드 전용 키움 호출</h2>
          </div>
          <strong className="stock-real-warning">실전 서버</strong>
        </div>

        <div className="stock-test-grid">
          {[
            ['token', '토큰 발급 테스트'],
            ['account', '계좌 목록 테스트'],
            ['balance', '잔고 / 보유 종목 테스트'],
            ['refresh', '포트폴리오 새로고침 테스트']
          ].map(([action, label]) => (
            <button
              key={action}
              className="stock-test-button"
              disabled={running !== null}
              onClick={() => execute(action as TestAction)}
              type="button"
            >
              {running === action ? '실행 중...' : label}
            </button>
          ))}
        </div>
      </section>

      <section className="stock-panel">
        <div className="stock-section-title">
          <div>
            <span>결과</span>
            <h2>응답 JSON</h2>
          </div>
          <small>{result?.executionTimeMs !== undefined ? `${result.executionTimeMs}ms` : ''}</small>
        </div>
        <pre className={`stock-json ${result?.ok === false ? 'error' : ''}`}>{JSON.stringify(result, null, 2)}</pre>
      </section>
    </main>
  );
}
