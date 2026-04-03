const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, _defaultSession(userId));
  }
  return sessions.get(userId);
}

function updateSession(userId, patch) {
  const current = getSession(userId);
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  sessions.set(userId, next);
  return next;
}

function resetSession(userId) {
  sessions.set(userId, _defaultSession(userId));
  return sessions.get(userId);
}

function _defaultSession(userId) {
  return {
    userId,
    state: 'MAIN',
    region1: null,
    region2: null,
    apartmentName: null,
    selectedCategory: null,
    selectedDay: null,
    selectedMenuId: null,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { getSession, updateSession, resetSession };
