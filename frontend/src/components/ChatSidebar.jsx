import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { getChats, createChat } from "../services/chatService";
import { markMessageDelivered } from "../services/messageService";

import {
  getMessageStatus,
  updateParticipantStatus,
} from "../utils/messageStatus";
import { getMessagePreviewText } from "../utils/messagePreview";

import { socket } from "../socket/socket";

import Avatar from "./Avatar";
import MessageTicks from "./MessageTicks";
import NewChatModal from "./NewChatModal";

const getOtherParticipant = (chat, userId) =>
  chat.participants?.find(
    (participant) =>
      participant._id?.toString() !==
      userId?.toString()
  );

const ChatSidebar = () => {
  const { user, logout } = useAuth();

  const { selectedChat, setSelectedChat } =
    useChat();

  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [showNewChat, setShowNewChat] =
    useState(false);

  useEffect(() => {
    if (!user) return;

    fetchChats();
  }, [user]);

  useEffect(() => {
    const handleUserStatus = ({
      userId,
      isOnline,
      lastSeen,
    }) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants:
            updateParticipantStatus(
              chat.participants,
              userId,
              isOnline,
              lastSeen
            ),
        }))
      );
    };

    const handleNewMessage = async (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      const senderId =
        message.sender._id ??
        message.sender;

      const isIncoming =
        senderId?.toString() !==
        user._id?.toString();

      const isChatOpen =
        selectedChat?._id?.toString() ===
        chatId?.toString();

      if (isIncoming && !isChatOpen) {
        markMessageDelivered(message._id).catch(
          console.error
        );
      }

      let shouldRefetch = false;

      setChats((prev) => {
        if (
          !prev.some(
            (chat) =>
              chat._id?.toString() ===
              chatId?.toString()
          )
        ) {
          shouldRefetch = true;
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

        return updated.sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        );
      });

      if (shouldRefetch) {
        await fetchChats();
      }
    };

    const handleMessagesRead = ({
      chatId,
      readBy,
    }) => {
      setChats((prev) =>
        prev.map((chat) => {
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
            user._id?.toString()
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
        })
      );
    };

    const handleMessageDelivered = ({
      messageId,
      chatId,
      deliveredTo,
    }) => {
      setChats((prev) =>
        prev.map((chat) => {
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
        })
      );
    };

    const handleMessageUpdated = (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      setChats((prev) =>
        prev.map((chat) => {
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
        })
      );
    };

    const handleMessageDeleted = ({
      messageId,
      chatId,
      lastMessage,
    }) => {
      setChats((prev) =>
        prev.map((chat) => {
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
        }).sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        )
      );
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
  }, [selectedChat, user._id]);

  const fetchChats = async () => {
    try {
      const data = await getChats();

      setChats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);

    setChats((prev) =>
      prev.map((c) =>
        c._id?.toString() ===
        chat._id?.toString()
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  const handleSelectUser = async (foundUser) => {
    try {
      const chat = await createChat(
        foundUser._id
      );

      setChats((prev) => {
        const exists = prev.some(
          (c) =>
            c._id?.toString() ===
            chat._id?.toString()
        );

        if (exists) {
          return prev.map((c) =>
            c._id?.toString() ===
            chat._id?.toString()
              ? chat
              : c
          );
        }

        return [chat, ...prev];
      });

      setSelectedChat(chat);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not start chat"
      );
    }
  };

  const handleLogout = () => {
    logout();

    navigate("/");
  };

  const existingChatUserIds = new Set(
    chats.flatMap((chat) =>
      chat.participants
        .filter(
          (participant) =>
            participant._id?.toString() !==
            user._id?.toString()
        )
        .map(
          (participant) => participant._id
        )
    )
  );

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <h2>Chat</h2>

        <button
          type="button"
          className="new-chat-btn"
          onClick={() =>
            setShowNewChat(true)
          }
        >
          + New chat
        </button>
      </div>

      <button
        type="button"
        className="sidebar-user sidebar-profile-link"
        onClick={() => navigate("/profile")}
      >
        <Avatar user={user} size="sm" />
        <span>
          Logged in as{" "}
          <strong>{user?.username}</strong>
        </span>
      </button>

      <div className="sidebar-section">
        {chats.length === 0 ? (
          <p className="sidebar-empty">
            No conversations yet. Start one
            with + New chat.
          </p>
        ) : (
          chats.map((chat) => {
            const otherUser =
              getOtherParticipant(
                chat,
                user._id
              );

            const isSelected =
              selectedChat?._id?.toString() ===
              chat._id?.toString();

            const lastMessage =
              chat.lastMessage;

            const lastSenderId =
              lastMessage?.sender?._id ??
              lastMessage?.sender;

            const isLastMessageMine =
              lastSenderId?.toString() ===
              user._id?.toString();

            const lastMessageStatus =
              isLastMessageMine &&
              lastMessage
                ? getMessageStatus(
                    lastMessage,
                    otherUser?._id
                  )
                : null;

            const unreadCount =
              chat.unreadCount || 0;

            return (
              <div
                key={chat._id}
                className={`chat-item ${
                  isSelected ? "active" : ""
                }`}
                onClick={() =>
                  handleChatClick(chat)
                }
              >
                <div className="chat-item-top">
                  <div className="chat-item-name">
                    <Avatar
                      user={otherUser}
                      size="sm"
                    />

                    <span
                      className={`status-dot ${
                        otherUser?.isOnline
                          ? "online"
                          : ""
                      }`}
                    />

                    {otherUser?.username ??
                      "Unknown"}
                  </div>

                  {unreadCount > 0 && (
                    <span className="unread-badge">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
                </div>

                {lastMessage && (
                  <div className="chat-item-preview">
                    {isLastMessageMine && (
                      <MessageTicks
                        status={
                          lastMessageStatus
                        }
                      />
                    )}

                    <span className="preview-text">
                      {getMessagePreviewText(
                        lastMessage
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        Logout
      </button>

      <NewChatModal
        isOpen={showNewChat}
        onClose={() =>
          setShowNewChat(false)
        }
        onSelectUser={handleSelectUser}
        existingChatUserIds={
          existingChatUserIds
        }
      />
    </div>
  );
};

export default ChatSidebar;
