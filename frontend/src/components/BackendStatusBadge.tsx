interface BackendStatusBadgeProps {
  status: 'checking' | 'online' | 'offline';
}

export function BackendStatusBadge({ status }: BackendStatusBadgeProps) {
  const label = status === 'online' ? '백엔드 정상' : status === 'offline' ? '백엔드 연결 안 됨' : '백엔드 확인 중';

  return <span className={`backend-status-badge ${status}`}>{label}</span>;
}
