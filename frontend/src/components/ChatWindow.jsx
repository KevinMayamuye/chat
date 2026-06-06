import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import {
  getMessages,
  markChatAsRead,
  markMessageDelivered,
} from "../services/messageService";

import {
  formatLastSeen,
  getMessageStatus,
  hasReadByUser,
  updateParticipantStatus,
} from "../utils/messageStatus";

import { socket } from "../socket/socket";

import MessageInput from "./MessageInput";
import MessageTicks from "./MessageTicks";

const ChatWindow = () => {
  const { user } = useAuth();

  const { selectedChat, setSelectedChat } =
    useChat();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] =
    useState(null);

  useEffect(() => {
    if (!selectedChat) {
      setOtherUser(null);
      return;
    }

    const participant =
      selectedChat.participants?.find(
        (p) =>
          p._id?.toString() !==
          user._id?.toString()
      );

    setOtherUser(participant ?? null);
  }, [selectedChat, user._id]);

  useEffect(() => {
    setMessages([]);

    if (!selectedChat) return;

    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    const handleUserStatus = ({
      userId,
      isOnline,
      lastSeen,
    }) => {
      if (
        userId?.toString() !==
        otherUser?._id?.toString()
      ) {
        return;
      }

      setOtherUser((prev) =>
        prev
          ? {
              ...prev,
              isOnline,
              lastSeen,
            }
          : prev
      );

      setSelectedChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants:
            updateParticipantStatus(
              prev.participants,
              userId,
              isOnline,
              lastSeen
            ),
        };
      });
    };

    const handleMessagesRead = ({
      chatId,
      readBy,
    }) => {
      if (
        chatId?.toString() !==
        selectedChat?._id?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (
            message.sender._id?.toString() !==
            user._id?.toString()
          ) {
            return message;
          }

          if (
            hasReadByUser(
              message.readBy,
              readBy
            )
          ) {
            return message;
          }

          return {
            ...message,
            readBy: [
              ...(message.readBy || []),
              readBy,
            ],
          };
        })
      );
    };

    const handleMessageDelivered = ({
      messageId,
      chatId,
      deliveredTo,
    }) => {
      if (
        chatId?.toString() !==
        selectedChat?._id?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (
            message._id?.toString() !==
            messageId?.toString()
          ) {
            return message;
          }

          return {
            ...message,
            deliveredTo: [
              ...(message.deliveredTo || []),
              deliveredTo,
            ],
          };
        })
      );
    };

    socket.on(
      "userStatusChange",
      handleUserStatus
    );
    socket.on(
      "messagesRead",
      handleMessagesRead
    );
    socket.on(
      "messageDelivered",
      handleMessageDelivered
    );

    return () => {
      socket.off(
        "userStatusChange",
        handleUserStatus
      );
      socket.off(
        "messagesRead",
        handleMessagesRead
      );
      socket.off(
        "messageDelivered",
        handleMessageDelivered
      );
    };
  }, [
    selectedChat,
    otherUser?._id,
    user._id,
    setSelectedChat,
  ]);

  useEffect(() => {
    const handleNewMessage = async (message) => {
      const messageChatId =
        message.chat?._id ?? message.chat;

      if (
        messageChatId?.toString() !==
        selectedChat?._id?.toString()
      ) {
        return;
      }

      const isOwnMessage =
        message.sender._id?.toString() ===
        user._id?.toString();

      if (!isOwnMessage) {
        try {
          await markChatAsRead(
            selectedChat._id
          );

          await markMessageDelivered(
            message._id
          );

          message = {
            ...message,
            readBy: [
              ...(message.readBy || []),
              user._id,
            ],
            deliveredTo: [
              ...(message.deliveredTo || []),
              user._id,
            ],
          };
        } catch (error) {
          console.error(error);
        }
      }

      setMessages((prev) => {
        const exists = prev.some(
          (msg) => msg._id === message._id
        );

        if (exists) {
          return prev;
        }

        return [...prev, message];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [selectedChat, user._id]);

  const fetchMessages = async () => {
    try {
      const data = await getMessages(
        selectedChat._id
      );

      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-window">
        <div className="chat-placeholder">
          Select a user to start chatting
        </div>
      </div>
    );
  }

  const statusText = formatLastSeen(
    otherUser?.isOnline,
    otherUser?.lastSeen
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button
          type="button"
          className="chat-back-btn"
          onClick={() => setSelectedChat(null)}
          aria-label="Back to chats"
        >
          ←
        </button>

        <div>
          <div className="chat-header-name">
            {otherUser?.username ?? "Chat"}
          </div>

          <div
            className={`chat-header-status ${
              otherUser?.isOnline
                ? "online"
                : ""
            }`}
          >
            {statusText}
          </div>
        </div>
      </div>

      <div className="messages">
        {messages.map((message) => {
          const isSent =
            message.sender._id?.toString() ===
            user._id?.toString();

          const status = isSent
            ? getMessageStatus(
                message,
                otherUser?._id
              )
            : null;

          return (
            <div
              key={message._id}
              className={`message ${
                isSent ? "sent" : "received"
              }${message.pending ? " pending" : ""}`}
            >
              <div className="message-content">
                {message.content}
              </div>

              {isSent && (
                <div className="message-meta">
                  <MessageTicks
                    status={status}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MessageInput
        selectedChat={selectedChat}
        setMessages={setMessages}
      />
    </div>
  );
};

export default ChatWindow;
