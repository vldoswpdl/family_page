import { DashboardResponse, PersonSlug, Schedule, ScheduleCreateInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface BackendHealth {
  ok: boolean;
  service: string;
}

export async function fetchDashboard(person: PersonSlug) {
  const response = await fetch(`${API_BASE_URL}/dashboard?person=${person}`);

  if (!response.ok) {
    throw new Error('가족 일정을 불러오지 못했습니다.');
  }

  return (await response.json()) as DashboardResponse;
}

export async function createSchedule(input: ScheduleCreateInput) {
  const response = await fetch(`${API_BASE_URL}/dashboard/schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  const payload = (await response.json().catch(() => null)) as
    | { createdCount: number; schedules: Schedule[] }
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error((payload && 'message' in payload && payload.message) || '일정을 저장하지 못했습니다.');
  }

  return payload as { createdCount: number; schedules: Schedule[] };
}

export async function deleteSchedule(scheduleId: string) {
  const response = await fetch(`${API_BASE_URL}/dashboard/schedules/${encodeURIComponent(scheduleId)}`, {
    method: 'DELETE'
  });

  const payload = (await response.json().catch(() => null)) as { deletedId?: string; message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message || '일정을 삭제하지 못했습니다.');
  }

  return payload as { deletedId: string };
}

export async function fetchBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`백엔드 응답 오류: ${response.status}`);
  }

  return (await response.json()) as BackendHealth;
}
