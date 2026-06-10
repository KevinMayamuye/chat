import { useEffect, useRef, useState } from "react";

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

import { canEditMessage } from "../utils/messagePreview";

import { socket } from "../socket/socket";

import MessageInput from "./MessageInput";
import MessageTicks from "./MessageTicks";
import MessageAttachment from "./MessageAttachment";
import MessageActions from "./MessageActions";
import MessageReplyPreview from "./MessageReplyPreview";
import ReactionBar from "./ReactionBar";
import Avatar from "./Avatar";
import ContactProfileModal from "./ContactProfileModal";

const ChatWindow = () => {
  const { user } = useAuth();

  const { selectedChat, setSelectedChat } =
    useChat();

  const selectedChatId = selectedChat?._id;

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] =
    useState(null);
  const [showContactProfile, setShowContactProfile] =
    useState(false);
  const [replyingTo, setReplyingTo] =
    useState(null);
  const [editingMessage, setEditingMessage] =
    useState(null);

  const messagesContainerRef = useRef(null);
  const selectedChatIdRef = useRef(selectedChatId);
  const replyingToRef = useRef(replyingTo);
  const editingMessageRef = useRef(editingMessage);
  const otherUserIdRef = useRef(otherUser?._id);
  const userIdRef = useRef(user._id);

  selectedChatIdRef.current = selectedChatId;
  replyingToRef.current = replyingTo;
  editingMessageRef.current = editingMessage;
  otherUserIdRef.current = otherUser?._id;
  userIdRef.current = user._id;

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  const updateLastMessageIfNeeded = (
    updatedMessage
  ) => {
    setSelectedChat((prev) => {
      if (!prev) return prev;

      const lastId =
        prev.lastMessage?._id ??
        prev.lastMessage;

      if (
        lastId?.toString() !==
        updatedMessage._id?.toString()
      ) {
        return prev;
      }

      return {
        ...prev,
        lastMessage: updatedMessage,
      };
    });
  };

  const handleReactionUpdate = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id
          ? updatedMessage
          : msg
      )
    );

    updateLastMessageIfNeeded(updatedMessage);
  };

  const handleMessageDeleted = ({
    messageId,
    chatId,
    lastMessage,
  }) => {
    if (
      chatId?.toString() !==
      selectedChatIdRef.current?.toString()
    ) {
      return;
    }

    setMessages((prev) =>
      prev.filter(
        (msg) =>
          msg._id?.toString() !==
          messageId?.toString()
      )
    );

    setSelectedChat((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        lastMessage: lastMessage ?? null,
      };
    });

    if (
      replyingToRef.current?._id?.toString() ===
      messageId?.toString()
    ) {
      setReplyingTo(null);
    }

    if (
      editingMessageRef.current?._id?.toString() ===
      messageId?.toString()
    ) {
      setEditingMessage(null);
    }
  };

  const handleLocalDelete = (result) => {
    handleMessageDeleted(result);
  };

  const handleReply = (message) => {
    setEditingMessage(null);
    setReplyingTo(message);
  };

  const handleEdit = (message) => {
    if (!canEditMessage(message)) {
      alert(
        "Messages can only be edited within 15 minutes of sending"
      );
      return;
    }

    setReplyingTo(null);
    setEditingMessage(message);
  };

  const fetchMessages = async (chatId) => {
    try {
      const data = await getMessages(chatId);

      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!selectedChat || messages.length === 0) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => cancelAnimationFrame(frameId);
  }, [messages, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId || !selectedChat) {
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
  }, [selectedChatId, user._id]);

  useEffect(() => {
    setMessages([]);
    setReplyingTo(null);
    setEditingMessage(null);

    if (!selectedChatId) return;

    fetchMessages(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    const handleUserStatus = ({
      userId,
      isOnline,
      lastSeen,
    }) => {
      if (
        userId?.toString() !==
        otherUserIdRef.current?.toString()
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
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (
            message.sender?._id?.toString() !==
            userIdRef.current?.toString()
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
        selectedChatIdRef.current?.toString()
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

    const handleMessageUpdated = (message) => {
      const messageChatId =
        message.chat?._id ?? message.chat;

      if (
        messageChatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === message._id
            ? message
            : msg
        )
      );

      setSelectedChat((prev) => {
        if (!prev) return prev;

        const lastId =
          prev.lastMessage?._id ??
          prev.lastMessage;

        if (
          lastId?.toString() !==
          message._id?.toString()
        ) {
          return prev;
        }

        return {
          ...prev,
          lastMessage: message,
        };
      });
    };

    const handleMessageDeletedEvent = (payload) => {
      const {
        messageId,
        chatId,
        lastMessage,
      } = payload;

      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.filter(
          (msg) =>
            msg._id?.toString() !==
            messageId?.toString()
        )
      );

      setSelectedChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          lastMessage: lastMessage ?? null,
        };
      });

      if (
        replyingToRef.current?._id?.toString() ===
        messageId?.toString()
      ) {
        setReplyingTo(null);
      }

      if (
        editingMessageRef.current?._id?.toString() ===
        messageId?.toString()
      ) {
        setEditingMessage(null);
      }
    };

    const handleNewMessage = async (message) => {
      const messageChatId =
        message.chat?._id ?? message.chat;

      if (
        messageChatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      const isOwnMessage =
        message.sender?._id?.toString() ===
        userIdRef.current?.toString();

      if (!isOwnMessage) {
        try {
          await markChatAsRead(
            selectedChatIdRef.current
          );

          await markMessageDelivered(
            message._id
          );

          message = {
            ...message,
            readBy: [
              ...(message.readBy || []),
              userIdRef.current,
            ],
            deliveredTo: [
              ...(message.deliveredTo || []),
              userIdRef.current,
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
    socket.on(
      "messageUpdated",
      handleMessageUpdated
    );
    socket.on(
      "messageDeleted",
      handleMessageDeletedEvent
    );
    socket.on(
      "newMessage",
      handleNewMessage
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
      socket.off(
        "messageUpdated",
        handleMessageUpdated
      );
      socket.off(
        "messageDeleted",
        handleMessageDeletedEvent
      );
      socket.off(
        "newMessage",
        handleNewMessage
      );
    };
  }, [selectedChatId, setSelectedChat]);

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

        <button
          type="button"
          className="chat-header-profile"
          onClick={() => setShowContactProfile(true)}
        >
          <Avatar
            user={otherUser}
            size="md"
          />

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
        </button>
      </div>

      <div
        className="messages"
        ref={messagesContainerRef}
      >
        {messages.map((message) => {
          const isSent =
            message.sender?._id?.toString() ===
            user._id?.toString();

          const status = isSent
            ? getMessageStatus(
                message,
                otherUser?._id
              )
            : null;

          const hasAttachment =
            message.messageType &&
            message.messageType !== "text";

          return (
            <div
              key={message._id}
              className={`message ${
                isSent ? "sent" : "received"
              }${message.pending ? " pending" : ""}${
                hasAttachment
                  ? " message-has-attachment"
                  : ""
              }`}
            >
              <div className="message-body">
                {message.replyTo && (
                  <MessageReplyPreview
                    replyTo={message.replyTo}
                  />
                )}

                {hasAttachment ? (
                  <MessageAttachment
                    message={message}
                  />
                ) : (
                  <div className="message-content">
                    {message.content}
                  </div>
                )}

                {message.editedAt && (
                  <span className="message-edited-label">
                    (edited)
                  </span>
                )}

                {isSent && (
                  <div className="message-meta">
                    <MessageTicks
                      status={status}
                    />
                  </div>
                )}
              </div>

              {!message.pending && (
                <>
                  <ReactionBar
                    message={message}
                    currentUserId={user._id}
                    onReactionUpdate={
                      handleReactionUpdate
                    }
                  />

                  <MessageActions
                    message={message}
                    currentUserId={user._id}
                    isSent={isSent}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleLocalDelete}
                    onReactionUpdate={
                      handleReactionUpdate
                    }
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <MessageInput
        selectedChat={selectedChat}
        setMessages={setMessages}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() =>
          setEditingMessage(null)
        }
        onMessageUpdated={
          updateLastMessageIfNeeded
        }
      />

      <ContactProfileModal
        isOpen={showContactProfile}
        userId={otherUser?._id}
        initialUser={otherUser}
        onClose={() => setShowContactProfile(false)}
      />
    </div>
  );
};

export default ChatWindow;
