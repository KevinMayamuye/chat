const MESSAGE_CAP = 100;

const chatListKey = (userId) =>
  `chatList_${userId}`;

const messageCacheKey = (userId, chatId) =>
  `msgCache_${userId}_${chatId}`;

const safeParse = (raw) => {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const loadChatList = (userId) => {
  if (!userId) return [];

  const data = safeParse(
    sessionStorage.getItem(chatListKey(userId))
  );

  return Array.isArray(data) ? data : [];
};

export const saveChatList = (userId, chats) => {
  if (!userId) return;

  sessionStorage.setItem(
    chatListKey(userId),
    JSON.stringify(chats)
  );
};

export const loadMessageCache = (userId, chatId) => {
  if (!userId || !chatId) return null;

  const data = safeParse(
    sessionStorage.getItem(
      messageCacheKey(userId, chatId)
    )
  );

  if (!data || !Array.isArray(data.messages)) {
    return null;
  }

  return {
    messages: data.messages,
    hasMore: data.hasMore ?? true,
    lastSyncedAt: data.lastSyncedAt ?? null,
  };
};

export const saveMessageCache = (
  userId,
  chatId,
  cacheEntry
) => {
  if (!userId || !chatId || !cacheEntry) return;

  const messages =
    cacheEntry.messages.length > MESSAGE_CAP
      ? cacheEntry.messages.slice(-MESSAGE_CAP)
      : cacheEntry.messages;

  sessionStorage.setItem(
    messageCacheKey(userId, chatId),
    JSON.stringify({
      messages,
      hasMore: cacheEntry.hasMore,
      lastSyncedAt: cacheEntry.lastSyncedAt,
    })
  );
};

export const clearUserCache = (userId) => {
  if (!userId) return;

  sessionStorage.removeItem(chatListKey(userId));

  const prefix = `msgCache_${userId}_`;

  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i);

    if (key?.startsWith(prefix)) {
      sessionStorage.removeItem(key);
    }
  }
};

export const mergeMessages = (
  existing,
  incoming
) => {
  const map = new Map();

  for (const msg of existing) {
    map.set(msg._id?.toString(), msg);
  }

  for (const msg of incoming) {
    map.set(msg._id?.toString(), msg);
  }

  return [...map.values()].sort(
    (a, b) =>
      new Date(a.createdAt) -
      new Date(b.createdAt)
  );
};
