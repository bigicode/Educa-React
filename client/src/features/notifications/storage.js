const readStateKeyPrefix = "educa_topbar_reads";

function getStorageKey(userId) {
  return `${readStateKeyPrefix}:${userId || "guest"}`;
}

function normalizeReadState(value) {
  return {
    messages: Array.isArray(value?.messages) ? Array.from(new Set(value.messages)) : [],
    notifications: Array.isArray(value?.notifications) ? Array.from(new Set(value.notifications)) : [],
  };
}

export function readTopbarReadState(userId) {
  if (typeof window === "undefined" || !userId) {
    return normalizeReadState();
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(userId));

    if (!rawValue) {
      return normalizeReadState();
    }

    return normalizeReadState(JSON.parse(rawValue));
  } catch {
    return normalizeReadState();
  }
}

export function persistTopbarReadState(userId, state) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(normalizeReadState(state)));
  } catch {
    // Ignore storage limitations in restricted environments.
  }
}
