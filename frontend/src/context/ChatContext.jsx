import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import { getChats } from "../services/chatService";
import {
  getMessages,
  markChatAsRead,
  markMessageDelivered,
} from "../services/messageService";

import { socket } from "../socket/socket";

import {
  clearUserCache,
  loadChatList,
  loadMessageCache,
  mergeMessages,
  saveChatList,
  saveMessageCache,
} from "../utils/chatCacheStorage";

import { updateParticipantStatus } from "../utils/messageStatus";

const DEFAULT_PAGE_SIZE = 50;

const emptyCacheEntry = () => ({
  messages: [],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  lastSyncedAt: null,
});

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id;

  const [selectedChat, setSelectedChat] =
    useState(null);
  const [chats, setChats] = useState([]);
  const [messageCache, setMessageCache] =
    useState({});
  const [chatsLoaded, setChatsLoaded] =
    useState(false);

  const selectedChatIdRef = useRef(null);
  const userIdRef = useRef(userId);
  const messageCacheRef = useRef(messageCache);
  const fetchChatsRef = useRef(null);

  selectedChatIdRef.current = selectedChat?._id;
  userIdRef.current = userId;
  messageCacheRef.current = messageCache;

  useEffect(() => {
    if (!userId) {
      setChats([]);
      setMessageCache({});
      setChatsLoaded(false);
      setSelectedChat(null);
      return;
    }

    const cachedChats = loadChatList(userId);
    setChats(cachedChats);
    setChatsLoaded(true);
  }, [userId]);

  const persistMessageCache = useCallback(
    (chatId, entry) => {
      if (!userId || !chatId) return;

      saveMessageCache(userId, chatId, entry);
    },
    [userId]
  );

  const setCacheEntry = useCallback(
    (chatId, updater) => {
      setMessageCache((prev) => {
        const current =
          prev[chatId] ?? emptyCacheEntry();
        const next =
          typeof updater === "function"
            ? updater(current)
            : updater;

        persistMessageCache(chatId, next);

        return {
          ...prev,
          [chatId]: next,
        };
      });
    },
    [persistMessageCache]
  );

  const fetchChats = useCallback(
    async ({ background = false } = {}) => {
      if (!userId) return;

      try {
        const data = await getChats();

        setChats(data);
        saveChatList(userId, data);
      } catch (error) {
        console.error(error);
      }
    },
    [userId]
  );

  fetchChatsRef.current = fetchChats;

  useEffect(() => {
    if (!userId || !chatsLoaded) return;

    fetchChats({ background: true });
  }, [userId, chatsLoaded, fetchChats]);

  const clearCache = useCallback(() => {
    if (userId) {
      clearUserCache(userId);
    }

    setChats([]);
    setMessageCache({});
    setChatsLoaded(false);
    setSelectedChat(null);
  }, [userId]);

  const addChat = useCallback(
    (chat) => {
      setChats((prev) => {
        const exists = prev.some(
          (c) =>
            c._id?.toString() ===
            chat._id?.toString()
        );

        let next;

        if (exists) {
          next = prev.map((c) =>
            c._id?.toString() ===
            chat._id?.toString()
              ? chat
              : c
          );
        } else {
          next = [chat, ...prev];
        }

        if (userId) {
          saveChatList(userId, next);
        }

        return next;
      });
    },
    [userId]
  );

  const markChatUnreadCleared = useCallback(
    (chatId) => {
      setChats((prev) => {
        const next = prev.map((c) =>
          c._id?.toString() ===
          chatId?.toString()
            ? { ...c, unreadCount: 0 }
            : c
        );

        if (userId) {
          saveChatList(userId, next);
        }

        return next;
      });
    },
    [userId]
  );

  const updateChatPreview = useCallback(
    (
      message,
      { isIncoming, isChatOpen } = {}
    ) => {
      const chatId =
        message.chat?._id ?? message.chat;

      if (!chatId) return;

      let missing = false;

      setChats((prev) => {
        const exists = prev.some(
          (c) =>
            c._id?.toString() ===
            chatId?.toString()
        );

        if (!exists) {
          missing = true;
          return prev;
        }

        const updated = prev.map((chat) => {
          if (
            chat._id?.toString() !==
            chatId?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount:
              isIncoming && !isChatOpen
                ? (chat.unreadCount || 0) + 1
                : isChatOpen
                  ? 0
                  : chat.unreadCount || 0,
          };
        });

        const sorted = [...updated].sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        );

        if (userId) {
          saveChatList(userId, sorted);
        }

        return sorted;
      });

      if (isChatOpen) {
        setSelectedChat((prev) => {
          if (
            !prev ||
            prev._id?.toString() !==
              chatId?.toString()
          ) {
            return prev;
          }

          return {
            ...prev,
            lastMessage: message,
            updatedAt: message.createdAt,
          };
        });
      }

      if (missing) {
        fetchChatsRef.current?.({
          background: true,
        });
      }
    },
    [userId]
  );

  const upsertMessage = useCallback(
    (chatId, message) => {
      setCacheEntry(chatId, (entry) => ({
        ...entry,
        messages: mergeMessages(
          entry.messages,
          [message]
        ),
        lastSyncedAt: Date.now(),
      }));
    },
    [setCacheEntry]
  );

  const updateMessageInCache = useCallback(
    (chatId, messageId, updater) => {
      setCacheEntry(chatId, (entry) => ({
        ...entry,
        messages: entry.messages.map((msg) =>
          msg._id?.toString() ===
          messageId?.toString()
            ? typeof updater === "function"
              ? updater(msg)
              : updater
            : msg
        ),
        lastSyncedAt: Date.now(),
      }));
    },
    [setCacheEntry]
  );

  const replaceMessageInCache = useCallback(
    (chatId, tempId, message) => {
      setCacheEntry(chatId, (entry) => ({
        ...entry,
        messages: entry.messages.map((msg) =>
          msg._id === tempId ? message : msg
        ),
        lastSyncedAt: Date.now(),
      }));
    },
    [setCacheEntry]
  );

  const removeMessageFromCache = useCallback(
    (chatId, messageId) => {
      setCacheEntry(chatId, (entry) => ({
        ...entry,
        messages: entry.messages.filter(
          (msg) =>
            msg._id?.toString() !==
            messageId?.toString()
        ),
        lastSyncedAt: Date.now(),
      }));
    },
    [setCacheEntry]
  );

  const setMessagesForChat = useCallback(
    (chatId, updater) => {
      setCacheEntry(chatId, (entry) => ({
        ...entry,
        messages:
          typeof updater === "function"
            ? updater(entry.messages)
            : updater,
        lastSyncedAt: Date.now(),
      }));
    },
    [setCacheEntry]
  );

  const loadMessages = useCallback(
    async (chatId) => {
      if (!chatId || !userId) return;

      setMessageCache((prev) => {
        if (prev[chatId]) return prev;

        const stored = loadMessageCache(
          userId,
          chatId
        );

        if (!stored) return prev;

        return {
          ...prev,
          [chatId]: {
            ...emptyCacheEntry(),
            ...stored,
          },
        };
      });

      const cached =
        messageCacheRef.current[chatId] ??
        loadMessageCache(userId, chatId);

      const hasCachedMessages =
        cached?.messages?.length > 0;

      setCacheEntry(chatId, (entry) => ({
        ...entry,
        isLoading: !hasCachedMessages,
      }));

      markChatAsRead(chatId).catch(console.error);

      try {
        const latestMessage =
          cached?.messages?.[
            cached.messages.length - 1
          ];

        if (latestMessage) {
          const { messages } = await getMessages(
            chatId,
            { after: latestMessage._id }
          );

          if (messages.length > 0) {
            setCacheEntry(chatId, (entry) => ({
              ...entry,
              messages: mergeMessages(
                entry.messages,
                messages
              ),
              isLoading: false,
              lastSyncedAt: Date.now(),
            }));
          } else {
            setCacheEntry(chatId, (entry) => ({
              ...entry,
              isLoading: false,
              lastSyncedAt: Date.now(),
            }));
          }
        } else {
          const { messages, hasMore } =
            await getMessages(chatId, {
              limit: DEFAULT_PAGE_SIZE,
            });

          setCacheEntry(chatId, (entry) => ({
            ...entry,
            messages,
            hasMore,
            isLoading: false,
            lastSyncedAt: Date.now(),
          }));
        }
      } catch (error) {
        console.error(error);

        setCacheEntry(chatId, (entry) => ({
          ...entry,
          isLoading: false,
        }));
      }
    },
    [userId, setCacheEntry]
  );

  const loadMoreMessages = useCallback(
    async (chatId) => {
      if (!chatId || !userId) return;

      const entry =
        messageCacheRef.current[chatId];

      if (
        !entry ||
        !entry.hasMore ||
        entry.isLoadingMore ||
        entry.isLoading ||
        entry.messages.length === 0
      ) {
        return;
      }

      const oldestMessage = entry.messages[0];

      setCacheEntry(chatId, (current) => ({
        ...current,
        isLoadingMore: true,
      }));

      try {
        const { messages, hasMore } =
          await getMessages(chatId, {
            before: oldestMessage._id,
            limit: DEFAULT_PAGE_SIZE,
          });

        setCacheEntry(chatId, (current) => ({
          ...current,
          messages: mergeMessages(
            messages,
            current.messages
          ),
          hasMore,
          isLoadingMore: false,
          lastSyncedAt: Date.now(),
        }));

        return messages.length;
      } catch (error) {
        console.error(error);

        setCacheEntry(chatId, (current) => ({
          ...current,
          isLoadingMore: false,
        }));

        return 0;
      }
    },
    [userId, setCacheEntry]
  );

  useEffect(() => {
    if (!userId) return;

    const handleUserStatus = ({
      userId: statusUserId,
      isOnline,
      lastSeen,
    }) => {
      setChats((prev) => {
        const next = prev.map((chat) => ({
          ...chat,
          participants: updateParticipantStatus(
            chat.participants,
            statusUserId,
            isOnline,
            lastSeen
          ),
        }));

        saveChatList(userId, next);

        return next;
      });

      setSelectedChat((prev) => {
        if (!prev) return prev;

        const isParticipant =
          prev.participants?.some(
            (p) =>
              p._id?.toString() ===
              statusUserId?.toString()
          );

        if (!isParticipant) return prev;

        return {
          ...prev,
          participants: updateParticipantStatus(
            prev.participants,
            statusUserId,
            isOnline,
            lastSeen
          ),
        };
      });
    };

    const handleNewMessage = async (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      const senderId =
        message.sender?._id ?? message.sender;

      const isIncoming =
        senderId?.toString() !==
        userIdRef.current?.toString();

      const isChatOpen =
        selectedChatIdRef.current?.toString() ===
        chatId?.toString();

      if (isIncoming && !isChatOpen) {
        markMessageDelivered(message._id).catch(
          console.error
        );
      }

      updateChatPreview(message, {
        isIncoming,
        isChatOpen,
      });
    };

    const handleMessagesRead = ({
      chatId,
      readBy,
    }) => {
      setChats((prev) => {
        const next = prev.map((chat) => {
          if (
            chat._id?.toString() !==
              chatId?.toString() ||
            !chat.lastMessage
          ) {
            return chat;
          }

          const senderId =
            chat.lastMessage.sender._id ??
            chat.lastMessage.sender;

          if (
            senderId?.toString() !==
            userIdRef.current?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              readBy: [
                ...(chat.lastMessage.readBy ||
                  []),
                readBy,
              ],
            },
          };
        });

        saveChatList(userId, next);

        return next;
      });
    };

    const handleMessageDelivered = ({
      messageId,
      chatId,
      deliveredTo,
    }) => {
      setChats((prev) => {
        const next = prev.map((chat) => {
          if (
            chat._id?.toString() !==
              chatId?.toString() ||
            !chat.lastMessage ||
            chat.lastMessage._id?.toString() !==
              messageId?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              deliveredTo: [
                ...(chat.lastMessage
                  .deliveredTo || []),
                deliveredTo,
              ],
            },
          };
        });

        saveChatList(userId, next);

        return next;
      });
    };

    const handleMessageUpdated = (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      setChats((prev) => {
        const next = prev.map((chat) => {
          if (
            chat._id?.toString() !==
            chatId?.toString()
          ) {
            return chat;
          }

          const lastId =
            chat.lastMessage?._id ??
            chat.lastMessage;

          if (
            lastId?.toString() !==
            message._id?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: message,
          };
        });

        saveChatList(userId, next);

        return next;
      });

      if (
        chatId?.toString() ===
        selectedChatIdRef.current?.toString()
      ) {
        upsertMessage(chatId, message);
      }
    };

    const handleMessageDeleted = ({
      messageId,
      chatId,
      lastMessage,
    }) => {
      setChats((prev) => {
        const next = prev
          .map((chat) => {
            if (
              chat._id?.toString() !==
              chatId?.toString()
            ) {
              return chat;
            }

            const lastId =
              chat.lastMessage?._id ??
              chat.lastMessage;

            if (
              lastId?.toString() !==
              messageId?.toString()
            ) {
              return chat;
            }

            return {
              ...chat,
              lastMessage: lastMessage ?? null,
              updatedAt:
                lastMessage?.createdAt ||
                chat.updatedAt,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.updatedAt) -
              new Date(a.updatedAt)
          );

        saveChatList(userId, next);

        return next;
      });

      if (
        chatId?.toString() ===
        selectedChatIdRef.current?.toString()
      ) {
        removeMessageFromCache(
          chatId,
          messageId
        );
      }
    };

    socket.on(
      "userStatusChange",
      handleUserStatus
    );
    socket.on("newMessage", handleNewMessage);
    socket.on(
      "messagesRead",
      handleMessagesRead
    );
    socket.on(
      "messageDelivered",
      handleMessageDelivered
    );
    socket.on(
      "messageUpdated",
      handleMessageUpdated
    );
    socket.on(
      "messageDeleted",
      handleMessageDeleted
    );

    return () => {
      socket.off(
        "userStatusChange",
        handleUserStatus
      );
      socket.off(
        "newMessage",
        handleNewMessage
      );
      socket.off(
        "messagesRead",
        handleMessagesRead
      );
      socket.off(
        "messageDelivered",
        handleMessageDelivered
      );
      socket.off(
        "messageUpdated",
        handleMessageUpdated
      );
      socket.off(
        "messageDeleted",
        handleMessageDeleted
      );
    };
  }, [
    userId,
    updateChatPreview,
    upsertMessage,
    removeMessageFromCache,
  ]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        chats,
        chatsLoaded,
        messageCache,
        fetchChats,
        loadMessages,
        loadMoreMessages,
        upsertMessage,
        updateMessageInCache,
        replaceMessageInCache,
        removeMessageFromCache,
        setMessagesForChat,
        updateChatPreview,
        addChat,
        markChatUnreadCleared,
        clearCache,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error(
      "useChat must be used within a ChatProvider"
    );
  }

  return context;
};
