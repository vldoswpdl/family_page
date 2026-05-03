import { prisma } from '../lib/prisma';
import { normalizeMode, toDbMode } from '../lib/stockUtils';
import { kiwoomService } from './kiwoomService';

export async function getCurrentExternalIp() {
  const response = await fetch('https://api.ipify.org?format=json');
  const payload = (await response.json().catch(() => ({}))) as { ip?: string };

  if (!response.ok || !payload.ip) {
    throw new Error(`External IP lookup failed with ${response.status}`);
  }

  return payload.ip;
}

export async function getKiwoomStatus(modeInput: unknown) {
  const mode = normalizeMode(modeInput);
  const publicConfig = kiwoomService.getPublicConfig(mode);
  let currentIp: string | null = null;
  let apiStatus = 'READY';
  let errorMessage: string | null = null;

  try {
    currentIp = await getCurrentExternalIp();
  } catch (error) {
    apiStatus = 'IP_LOOKUP_FAILED';
    errorMessage = error instanceof Error ? error.message : 'External IP lookup failed';
  }

  const registeredIp = publicConfig.registeredIp || null;
  const isIpMatched = Boolean(currentIp && registeredIp && currentIp === registeredIp);
  const token = await prisma.stockTokenStore.findUnique({
    where: {
      mode: toDbMode(mode)
    }
  });
  const lastSuccess = await prisma.portfolioSnapshot.findFirst({
    where: {
      mode: toDbMode(mode),
      fetchStatus: 'SUCCESS'
    },
    orderBy: {
      fetchedAt: 'desc'
    }
  });

  if (!publicConfig.hasAppKey || !publicConfig.hasSecretKey) {
    apiStatus = 'NOT_CONFIGURED';
  } else if (registeredIp && currentIp && !isIpMatched) {
    apiStatus = 'IP_MISMATCH';
  } else if (token && token.expiresAt.getTime() <= Date.now()) {
    apiStatus = 'TOKEN_EXPIRED';
  } else if (apiStatus === 'READY') {
    apiStatus = 'READY';
  }

  const log = await prisma.apiStatusLog.create({
    data: {
      mode: toDbMode(mode),
      currentIp,
      registeredIp,
      isIpMatched,
      apiStatus,
      errorMessage
    }
  });

  return {
    mode,
    currentIp,
    registeredIp,
    isIpMatched,
    apiStatus,
    tokenStatus: token
      ? {
          exists: true,
          expiresAt: token.expiresAt.toISOString(),
          isExpired: token.expiresAt.getTime() <= Date.now()
        }
      : {
          exists: false,
          expiresAt: null,
          isExpired: true
        },
    lastSuccessfulFetchAt: lastSuccess?.fetchedAt.toISOString() ?? null,
    checkedAt: log.checkedAt.toISOString(),
    errorMessage
  };
}

