const buildStorageKey = (userId) => `delivery-kyc:${userId || "guest"}`;

export const readDeliveryKyc = (userId) => {
  try {
    const raw = localStorage.getItem(buildStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveDeliveryKyc = (userId, payload) => {
  localStorage.setItem(buildStorageKey(userId), JSON.stringify(payload));
};

export const hasDeliveryKyc = (userId) => Boolean(readDeliveryKyc(userId));

export const clearDeliveryKyc = (userId) => {
  localStorage.removeItem(buildStorageKey(userId));
};
