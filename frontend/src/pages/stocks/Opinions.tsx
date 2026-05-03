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
        setMessage('Opinion updated.');
      } else {
        await createOpinion(payload);
        setMessage('Opinion created.');
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadOpinions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Opinion save failed.');
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>Opinions</p>
          <h1>Buy / Sell / Hold</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">Dashboard</a>
          <a href="/stocks/admin/test">API Test</a>
          <a href="/stocks/reports">Reports</a>
          <a href="/stocks/opinions">Opinions</a>
        </nav>
      </header>

      <section className="stock-grid two">
        <form className="stock-panel stock-form" onSubmit={submit}>
          <div className="stock-section-title">
            <div>
              <span>{editingId ? 'Edit opinion' : 'Create opinion'}</span>
              <h2>Investment note</h2>
            </div>
          </div>
          <label>
            Owner
            <input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
          </label>
          <label>
            Stock code
            <input value={form.stockCode} onChange={(event) => setForm({ ...form, stockCode: event.target.value })} />
          </label>
          <label>
            Stock name
            <input value={form.stockName} onChange={(event) => setForm({ ...form, stockName: event.target.value })} />
          </label>
          <label>
            Opinion
            <select value={form.opinionType} onChange={(event) => setForm({ ...form, opinionType: event.target.value as OpinionType })}>
              {OPINION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Text
            <textarea value={form.opinionText} onChange={(event) => setForm({ ...form, opinionText: event.target.value })} />
          </label>
          <label>
            Risk points
            <textarea value={form.riskPoints} onChange={(event) => setForm({ ...form, riskPoints: event.target.value })} />
          </label>
          <div className="stock-grid two compact">
            <label>
              Target
              <input value={form.targetPrice} onChange={(event) => setForm({ ...form, targetPrice: event.target.value })} />
            </label>
            <label>
              Stop loss
              <input value={form.stopLossPrice} onChange={(event) => setForm({ ...form, stopLossPrice: event.target.value })} />
            </label>
          </div>
          <button className="stock-primary-button" type="submit">
            {editingId ? 'Update' : 'Create'}
          </button>
          {message ? <p>{message}</p> : null}
        </form>

        <section className="stock-panel">
          <div className="stock-section-title">
            <div>
              <span>Saved</span>
              <h2>Opinion list</h2>
            </div>
            <input className="stock-filter-input" placeholder="Filter stock code" value={filter} onChange={(event) => setFilter(event.target.value)} />
          </div>
          <div className="stock-opinion-list">
            {opinions.map((opinion) => (
              <article key={opinion.id} className={`stock-opinion ${opinion.opinionType.toLowerCase()}`}>
                <span>{opinion.opinionType}</span>
                <strong>{opinion.stockName || opinion.stockCode}</strong>
                <p>{opinion.opinionText}</p>
                <small>{new Date(opinion.createdAt).toLocaleString()}</small>
                <button type="button" onClick={() => edit(opinion)}>
                  Edit
                </button>
              </article>
            ))}
            {!opinions.length ? <div className="stock-empty">No opinions saved.</div> : null}
          </div>
        </section>
      </section>
    </main>
  );
}

