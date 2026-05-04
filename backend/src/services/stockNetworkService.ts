import { prisma } from '../lib/prisma';
import { normalizeMode, toDbMode } from '../lib/stockUtils';
import { kiwoomService } from './kiwoomService';

const DEFAULT_REAL_FIXED_IP = '124.59.176.5';
const MAX_REGISTERED_IPS = 10;

function isValidIpv4(value: string) {
  const parts = value.trim().split('.');
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) {
        return false;
      }

      const parsed = Number(part);
      return parsed >= 0 && parsed <= 255;
    })
  );
}

async function ensureDefaultRegisteredIp() {
  const existingCount = await prisma.stockRegisteredIp.count({
    where: {
      mode: 'REAL'
    }
  });

  if (existingCount === 0) {
    await prisma.stockRegisteredIp.create({
      data: {
        mode: 'REAL',
        ip: DEFAULT_REAL_FIXED_IP,
        label: 'Home fixed IP'
      }
    });
  }
}

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

  await ensureDefaultRegisteredIp();
  const registeredIps = await listRegisteredIps(mode);
  const registeredIpValues = registeredIps.filter((item) => item.isActive).map((item) => item.ip);
  const envRegisteredIp = publicConfig.registeredIp || null;
  const registeredIp = registeredIpValues[0] || envRegisteredIp;
  const isIpMatched = Boolean(currentIp && registeredIpValues.length && registeredIpValues.includes(currentIp));
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
  } else if (registeredIpValues.length && currentIp && !isIpMatched) {
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
    registeredIps,
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

export async function listRegisteredIps(modeInput: unknown) {
  const mode = normalizeMode(modeInput);
  await ensureDefaultRegisteredIp();

  return prisma.stockRegisteredIp.findMany({
    where: {
      mode: toDbMode(mode)
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

export async function createRegisteredIp(modeInput: unknown, ipInput: unknown, labelInput?: unknown) {
  const mode = normalizeMode(modeInput);
  const ip = typeof ipInput === 'string' ? ipInput.trim() : '';
  const label = typeof labelInput === 'string' ? labelInput.trim() : null;

  if (!isValidIpv4(ip)) {
    throw new Error('Invalid IPv4 address.');
  }

  const count = await prisma.stockRegisteredIp.count({
    where: {
      mode: toDbMode(mode)
    }
  });

  if (count >= MAX_REGISTERED_IPS) {
    throw new Error(`Only ${MAX_REGISTERED_IPS} registered IPs are allowed.`);
  }

  return prisma.stockRegisteredIp.create({
    data: {
      mode: toDbMode(mode),
      ip,
      label,
      isActive: true
    }
  });
}

export async function updateRegisteredIp(idInput: unknown, ipInput: unknown, labelInput: unknown, isActiveInput: unknown) {
  const id = Number(idInput);
  const ip = typeof ipInput === 'string' ? ipInput.trim() : '';

  if (!Number.isInteger(id)) {
    throw new Error('Invalid registered IP id.');
  }

  if (!isValidIpv4(ip)) {
    throw new Error('Invalid IPv4 address.');
  }

  return prisma.stockRegisteredIp.update({
    where: {
      id
    },
    data: {
      ip,
      label: typeof labelInput === 'string' && labelInput.trim() ? labelInput.trim() : null,
      isActive: Boolean(isActiveInput)
    }
  });
}

export async function deleteRegisteredIp(idInput: unknown) {
  const id = Number(idInput);

  if (!Number.isInteger(id)) {
    throw new Error('Invalid registered IP id.');
  }

  return prisma.stockRegisteredIp.delete({
    where: {
      id
    }
  });
}
