import { useEffect, useState } from 'react';
import { ModeBadge } from '../../components/stocks/ModeBadge';
import { fetchKiwoomStatus, refreshStockPortfolio, runStockTest } from '../../lib/stockApi';
import { ApiTestResult, KiwoomStatus, StockMode } from '../../types/stocks';

type TestAction = 'token' | 'account' | 'balance' | 'refresh';

export function AdminTest() {
  const [mode, setMode] = useState<StockMode>('mock');
  const [status, setStatus] = useState<KiwoomStatus | null>(null);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [running, setRunning] = useState<TestAction | null>(null);

  async function loadStatus() {
    const data = await fetchKiwoomStatus(mode);
    setStatus(data);
  }

  useEffect(() => {
    void loadStatus().catch(() => setStatus(null));
  }, [mode]);

  async function execute(action: TestAction) {
    if (mode === 'real' && !window.confirm('Run this test against the REAL Kiwoom server?')) {
      return;
    }

    setRunning(action);
    setResult(null);

    try {
      const data = action === 'refresh' ? await refreshStockPortfolio(mode) : await runStockTest(action, mode);
      setResult(data);
      await loadStatus();
    } catch (error) {
      setResult({
        ok: false,
        errorMessage: error instanceof Error ? error.message : 'Test failed.'
      });
    } finally {
      setRunning(null);
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>Admin Test</p>
          <h1>Kiwoom API</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">Dashboard</a>
          <a href="/stocks/admin/test">API Test</a>
          <a href="/stocks/reports">Reports</a>
          <a href="/stocks/opinions">Opinions</a>
        </nav>
      </header>

      <section className="stock-toolbar">
        <div className="stock-control-group">
          <button className={mode === 'mock' ? 'active' : ''} onClick={() => setMode('mock')} type="button">
            Mock
          </button>
          <button className={mode === 'real' ? 'active real' : 'real'} onClick={() => setMode('real')} type="button">
            Real
          </button>
          <ModeBadge mode={mode} />
        </div>
      </section>

      <section className="stock-meta-panel">
        <div>
          <span>Current IP</span>
          <strong>{status?.currentIp || 'Unknown'}</strong>
        </div>
        <div>
          <span>Registered IP</span>
          <strong>{status?.registeredIp || 'Not configured'}</strong>
        </div>
        <div>
          <span>IP match</span>
          <strong>{status?.isIpMatched ? 'Matched' : 'Not matched'}</strong>
        </div>
        <div>
          <span>Token</span>
          <strong>{status?.tokenStatus.exists ? (status.tokenStatus.isExpired ? 'Expired' : 'Stored') : 'Missing'}</strong>
        </div>
      </section>

      <section className="stock-panel">
        <div className="stock-section-title">
          <div>
            <span>Safe test panel</span>
            <h2>Backend-only Kiwoom calls</h2>
          </div>
          {mode === 'real' ? <strong className="stock-real-warning">REAL SERVER</strong> : null}
        </div>

        <div className="stock-test-grid">
          {[
            ['token', 'Issue Token Test'],
            ['account', 'Account List Test'],
            ['balance', 'Balance / Holdings Test'],
            ['refresh', 'Refresh Portfolio Test']
          ].map(([action, label]) => (
            <button
              key={action}
              className="stock-test-button"
              disabled={running !== null}
              onClick={() => execute(action as TestAction)}
              type="button"
            >
              {running === action ? 'Running...' : label}
            </button>
          ))}
        </div>
      </section>

      <section className="stock-panel">
        <div className="stock-section-title">
          <div>
            <span>Result</span>
            <h2>Response JSON</h2>
          </div>
          <small>{result?.executionTimeMs !== undefined ? `${result.executionTimeMs}ms` : ''}</small>
        </div>
        <pre className={`stock-json ${result?.ok === false ? 'error' : ''}`}>{JSON.stringify(result, null, 2)}</pre>
      </section>
    </main>
  );
}

