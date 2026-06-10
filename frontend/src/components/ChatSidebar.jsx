import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { createChat } from "../services/chatService";

import { getMessagePreviewText } from "../utils/messagePreview";
import {
  getChatTitle,
  getGroupAvatarUser,
  getGroupMessageStatus,
  getOtherParticipant,
  getSidebarPreviewSender,
  isGroupChat,
} from "../utils/chatDisplay";

import {
  getMessageStatus,
} from "../utils/messageStatus";

import Avatar from "./Avatar";
import MessageTicks from "./MessageTicks";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";

const ChatSidebar = () => {
  const { user, logout } = useAuth();

  const {
    selectedChat,
    setSelectedChat,
    chats,
    addChat,
    markChatUnreadCleared,
    clearCache,
  } = useChat();

  const navigate = useNavigate();

  const [showNewChat, setShowNewChat] =
    useState(false);
  const [showNewGroup, setShowNewGroup] =
    useState(false);

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    markChatUnreadCleared(chat._id);
  };

  const handleSelectUser = async (foundUser) => {
    try {
      const chat = await createChat(
        foundUser._id
      );

      addChat(chat);
      setSelectedChat(chat);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not start chat"
      );
    }
  };

  const handleGroupCreated = (chat) => {
    addChat(chat);
    setSelectedChat(chat);
  };

  const handleLogout = () => {
    clearCache();
    logout();
    navigate("/");
  };

  const existingChatUserIds = new Set(
    chats
      .filter((chat) => !isGroupChat(chat))
      .flatMap((chat) =>
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

        <div className="sidebar-actions">
          <button
            type="button"
            className="new-chat-btn"
            onClick={() =>
              setShowNewChat(true)
            }
          >
            + New chat
          </button>

          <button
            type="button"
            className="new-chat-btn new-group-btn"
            onClick={() =>
              setShowNewGroup(true)
            }
          >
            + New group
          </button>
        </div>
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
            const isGroup = isGroupChat(chat);

            const otherUser = isGroup
              ? null
              : getOtherParticipant(
                  chat,
                  user._id
                );

            const chatTitle = getChatTitle(
              chat,
              user._id
            );

            const avatarUser = isGroup
              ? getGroupAvatarUser(chat)
              : otherUser;

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
              isLastMessageMine && lastMessage
                ? isGroup
                  ? getGroupMessageStatus(
                      lastMessage,
                      chat,
                      user._id
                    )
                  : getMessageStatus(
                      lastMessage,
                      otherUser?._id
                    )
                : null;

            const previewSender =
              getSidebarPreviewSender(
                lastMessage,
                chat,
                user._id
              );

            const previewText =
              getMessagePreviewText(
                lastMessage
              );

            const unreadCount =
              chat.unreadCount || 0;

            return (
              <div
                key={chat._id}
                className={`chat-item ${
                  isSelected ? "active" : ""
                }${isGroup ? " group" : ""}`}
                onClick={() =>
                  handleChatClick(chat)
                }
              >
                <div className="chat-item-top">
                  <div className="chat-item-name">
                    <Avatar
                      user={avatarUser}
                      size="sm"
                    />

                    {!isGroup && (
                      <span
                        className={`status-dot ${
                          otherUser?.isOnline
                            ? "online"
                            : ""
                        }`}
                      />
                    )}

                    {chatTitle}
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
                      {previewSender
                        ? `${previewSender}: ${previewText}`
                        : previewText}
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
      <CreateGroupModal
        isOpen={showNewGroup}
        onClose={() =>
          setShowNewGroup(false)
        }
        onGroupCreated={handleGroupCreated}
        chats={chats}
        currentUserId={user._id}
      />
    </div>
  );
};

export default ChatSidebar;
