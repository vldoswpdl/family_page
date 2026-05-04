import { FormEvent, useState } from 'react';
import { RegisteredIp, StockMode } from '../../types/stocks';
import { createRegisteredIp, deleteRegisteredIp, updateRegisteredIp } from '../../lib/stockApi';

interface FixedIpManagerProps {
  mode: StockMode;
  currentIp: string | null;
  registeredIps: RegisteredIp[];
  onChanged: () => Promise<void>;
}

export function FixedIpManager({ mode, currentIp, registeredIps, onChanged }: FixedIpManagerProps) {
  const [ip, setIp] = useState('');
  const [label, setLabel] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeIps = registeredIps.filter((item) => item.isActive).map((item) => item.ip);
  const isMatched = Boolean(currentIp && activeIps.includes(currentIp));

  function startEdit(item: RegisteredIp) {
    setEditingId(item.id);
    setIp(item.ip);
    setLabel(item.label || '');
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setIp('');
    setLabel('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    try {
      if (editingId) {
        await updateRegisteredIp(editingId, { ip, label, isActive: true });
      } else {
        await createRegisteredIp({ mode, ip, label });
      }

      resetForm();
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fixed IP save failed.');
    }
  }

  async function remove(id: number) {
    setMessage(null);
    try {
      await deleteRegisteredIp(id);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fixed IP delete failed.');
    }
  }

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>Fixed IP Access</span>
          <h2>Kiwoom 등록 고정 IP</h2>
        </div>
        <strong className={isMatched ? 'stock-ip-state matched' : 'stock-ip-state'}>{isMatched ? 'MATCHED' : 'CHECK'}</strong>
      </div>

      <div className="stock-ip-summary">
        <div>
          <span>현재 외부 IP</span>
          <strong>{currentIp || 'Unknown'}</strong>
        </div>
        <div>
          <span>등록 가능 수</span>
          <strong>{registeredIps.length}/10</strong>
        </div>
      </div>

      <div className="stock-fixed-ip-list">
        {registeredIps.slice(0, 10).map((item) => (
          <article key={item.id} className={item.isActive ? 'active' : ''}>
            <div>
              <strong>{item.ip}</strong>
              <span>{item.label || 'No label'}</span>
            </div>
            <div className="stock-ip-actions">
              <button type="button" onClick={() => startEdit(item)}>
                Edit
              </button>
              <button type="button" onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <form className="stock-ip-form" onSubmit={submit}>
        <input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="124.59.176.5" />
        <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label" />
        <button className="stock-primary-button" type="submit" disabled={!editingId && registeredIps.length >= 10}>
          {editingId ? 'Update IP' : 'Add IP'}
        </button>
        {editingId ? (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        ) : null}
      </form>
      {message ? <p className="stock-form-message">{message}</p> : null}
    </section>
  );
}

