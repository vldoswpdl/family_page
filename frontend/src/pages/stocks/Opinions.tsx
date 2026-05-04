import { FormEvent, useEffect, useState } from 'react';
import { createOpinion, fetchOpinions, updateOpinion } from '../../lib/stockApi';
import { OpinionType, TradeOpinion } from '../../types/stocks';

const OPINION_TYPES: OpinionType[] = ['BUY', 'SELL', 'HOLD', 'WATCH'];

const EMPTY_FORM = {
  ownerName: 'Family',
  stockCode: '',
  stockName: '',
  opinionType: 'WATCH' as OpinionType,
  opinionText: '',
  riskPoints: '',
  targetPrice: '',
  stopLossPrice: ''
};

export function Opinions() {
  const [opinions, setOpinions] = useState<TradeOpinion[]>([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadOpinions() {
    const data = await fetchOpinions(filter ? { stockCode: filter } : undefined);
    setOpinions(data);
  }

  useEffect(() => {
    void loadOpinions();
  }, [filter]);

  function edit(opinion: TradeOpinion) {
    setEditingId(opinion.id);
    setForm({
      ownerName: opinion.ownerName,
      stockCode: opinion.stockCode,
      stockName: opinion.stockName,
      opinionType: opinion.opinionType,
      opinionText: opinion.opinionText,
      riskPoints: opinion.riskPoints || '',
      targetPrice: opinion.targetPrice?.toString() || '',
      stopLossPrice: opinion.stopLossPrice?.toString() || ''
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const payload = {
      ...form,
      targetPrice: form.targetPrice ? Number(form.targetPrice) : null,
      stopLossPrice: form.stopLossPrice ? Number(form.stopLossPrice) : null
    };

    try {
      if (editingId) {
        await updateOpinion(editingId, payload);
        setMessage('의견을 수정했습니다.');
      } else {
        await createOpinion(payload);
        setMessage('의견을 생성했습니다.');
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadOpinions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '의견 저장에 실패했습니다.');
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>투자 의견</p>
          <h1>매수 / 매도 / 보유</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">대시보드</a>
          <a href="/stocks/admin/test">API 테스트</a>
          <a href="/stocks/reports">리포트</a>
          <a href="/stocks/opinions">투자 의견</a>
        </nav>
      </header>

      <section className="stock-grid two">
        <form className="stock-panel stock-form" onSubmit={submit}>
          <div className="stock-section-title">
            <div>
              <span>{editingId ? '의견 수정' : '의견 생성'}</span>
              <h2>투자 메모</h2>
            </div>
          </div>
          <label>
            소유자
            <input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
          </label>
          <label>
            종목 코드
            <input value={form.stockCode} onChange={(event) => setForm({ ...form, stockCode: event.target.value })} />
          </label>
          <label>
            종목명
            <input value={form.stockName} onChange={(event) => setForm({ ...form, stockName: event.target.value })} />
          </label>
          <label>
            의견
            <select value={form.opinionType} onChange={(event) => setForm({ ...form, opinionType: event.target.value as OpinionType })}>
              {OPINION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'BUY' ? '매수' : type === 'SELL' ? '매도' : type === 'HOLD' ? '보유' : '관망'}
                </option>
              ))}
            </select>
          </label>
          <label>
            의견 내용
            <textarea value={form.opinionText} onChange={(event) => setForm({ ...form, opinionText: event.target.value })} />
          </label>
          <label>
            리스크 포인트
            <textarea value={form.riskPoints} onChange={(event) => setForm({ ...form, riskPoints: event.target.value })} />
          </label>
          <div className="stock-grid two compact">
            <label>
              목표가
              <input value={form.targetPrice} onChange={(event) => setForm({ ...form, targetPrice: event.target.value })} />
            </label>
            <label>
              손절가
              <input value={form.stopLossPrice} onChange={(event) => setForm({ ...form, stopLossPrice: event.target.value })} />
            </label>
          </div>
          <button className="stock-primary-button" type="submit">
            {editingId ? '수정' : '생성'}
          </button>
          {message ? <p>{message}</p> : null}
        </form>

        <section className="stock-panel">
          <div className="stock-section-title">
            <div>
              <span>저장된 의견</span>
              <h2>의견 목록</h2>
            </div>
            <input className="stock-filter-input" placeholder="종목 코드 필터" value={filter} onChange={(event) => setFilter(event.target.value)} />
          </div>
          <div className="stock-opinion-list">
            {opinions.map((opinion) => (
              <article key={opinion.id} className={`stock-opinion ${opinion.opinionType.toLowerCase()}`}>
                <span>
                  {opinion.opinionType === 'BUY'
                    ? '매수'
                    : opinion.opinionType === 'SELL'
                      ? '매도'
                      : opinion.opinionType === 'HOLD'
                        ? '보유'
                        : '관망'}
                </span>
                <strong>{opinion.stockName || opinion.stockCode}</strong>
                <p>{opinion.opinionText}</p>
                <small>{new Date(opinion.createdAt).toLocaleString()}</small>
                <button type="button" onClick={() => edit(opinion)}>
                  수정
                </button>
              </article>
            ))}
            {!opinions.length ? <div className="stock-empty">저장된 의견이 없습니다.</div> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
