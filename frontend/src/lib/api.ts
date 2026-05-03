import { DashboardResponse, PersonSlug } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchDashboard(person: PersonSlug) {
  const response = await fetch(`${API_BASE_URL}/dashboard?person=${person}`);

  if (!response.ok) {
    throw new Error('가족 일정을 불러오지 못했습니다.');
  }

  return (await response.json()) as DashboardResponse;
}

