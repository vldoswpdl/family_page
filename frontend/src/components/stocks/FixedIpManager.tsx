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
      setMessage(error instanceof Error ? error.message : '고정 IP 저장에 실패했습니다.');
    }
  }

  async function remove(id: number) {
    setMessage(null);
    try {
      await deleteRegisteredIp(id);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '고정 IP 삭제에 실패했습니다.');
    }
  }

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>고정 IP 접근</span>
          <h2>키움 등록 IP 관리</h2>
        </div>
        <strong className={isMatched ? 'stock-ip-state matched' : 'stock-ip-state'}>{isMatched ? '일치' : '확인 필요'}</strong>
      </div>

      <div className="stock-ip-summary">
        <div>
          <span>현재 외부 IP</span>
          <strong>{currentIp || '확인 불가'}</strong>
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
              <span>{item.label || '라벨 없음'}</span>
            </div>
            <div className="stock-ip-actions">
              <button type="button" onClick={() => startEdit(item)}>
                수정
              </button>
              <button type="button" onClick={() => remove(item.id)}>
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>

      <form className="stock-ip-form" onSubmit={submit}>
        <input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="124.59.176.5" />
        <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="라벨" />
        <button className="stock-primary-button" type="submit" disabled={!editingId && registeredIps.length >= 10}>
          {editingId ? 'IP 수정' : 'IP 추가'}
        </button>
        {editingId ? (
          <button type="button" onClick={resetForm}>
            취소
          </button>
        ) : null}
      </form>
      {message ? <p className="stock-form-message">{message}</p> : null}
    </section>
  );
}
