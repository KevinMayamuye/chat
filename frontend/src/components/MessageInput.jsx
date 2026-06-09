import {
  useEffect,
  useRef,
  useState,
} from "react";

import EmojiPicker from "emoji-picker-react";

import { useAuth } from "../context/AuthContext";
import {
  editMessage,
  sendMessage,
  sendMessageWithFile,
} from "../services/messageService";
import {
  canEditMessage,
  getMessageTypeFromFile,
} from "../utils/messagePreview";

import MessageReplyPreview from "./MessageReplyPreview";

const ACCEPTED_FILES =
  "image/jpeg,image/png,image/gif,image/webp," +
  "video/mp4,video/webm,video/quicktime," +
  "application/pdf,text/plain," +
  "application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-powerpoint," +
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const MessageInput = ({
  selectedChat,
  setMessages,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onMessageUpdated,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef(null);
  const pickerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content || "");
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showEmojiPicker]);

  const insertEmoji = (emojiData) => {
    const textarea = textareaRef.current;
    const emoji = emojiData.emoji;

    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setContent((prev) =>
      prev.slice(0, start) +
        emoji +
        prev.slice(end)
    );

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });

    setShowEmojiPicker(false);
  };

  const sendTextMessage = async (trimmedContent) => {
    const replyToMessageId =
      replyingTo?._id ?? null;

    const tempId = `temp-${crypto.randomUUID()}`;

    const optimisticMessage = {
      _id: tempId,
      messageType: "text",
      content: trimmedContent,
      sender: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture ?? null,
      },
      chat: selectedChat._id,
      readBy: [user._id],
      deliveredTo: [],
      pending: true,
      ...(replyingTo && {
        replyTo: {
          messageId: replyingTo._id,
          senderUsername:
            replyingTo.sender?.username ||
            "Unknown",
          content: replyingTo.content || "",
          messageType:
            replyingTo.messageType || "text",
        },
      }),
    };

    setContent("");
    onCancelReply?.();

    setMessages((prev) => [
      ...prev,
      optimisticMessage,
    ]);

    try {
      const message = await sendMessage(
        selectedChat._id,
        trimmedContent,
        replyToMessageId
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? message : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== tempId)
      );

      setContent(trimmedContent);

      alert(
        error.response?.data?.message ||
        "Could not send message"
      );

      console.error(error);
    }
  };

  const saveEdit = async (trimmedContent) => {
    if (!canEditMessage(editingMessage)) {
      alert(
        "Messages can only be edited within 15 minutes of sending"
      );
      onCancelEdit?.();
      return;
    }

    try {
      const updated = await editMessage(
        editingMessage._id,
        trimmedContent
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updated._id ? updated : msg
        )
      );

      onMessageUpdated?.(updated);
      setContent("");
      onCancelEdit?.();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not edit message"
      );

      console.error(error);
    }
  };

  const sendFileMessage = async (file) => {
    const caption = content.trim();
    const replyToMessageId =
      replyingTo?._id ?? null;
    const tempId = `temp-${crypto.randomUUID()}`;
    const localPreviewUrl =
      URL.createObjectURL(file);
    const messageType =
      getMessageTypeFromFile(file);

    const optimisticMessage = {
      _id: tempId,
      messageType,
      content: caption,
      attachment: {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
      localPreviewUrl,
      sender: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture ?? null,
      },
      chat: selectedChat._id,
      readBy: [user._id],
      deliveredTo: [],
      pending: true,
      ...(replyingTo && {
        replyTo: {
          messageId: replyingTo._id,
          senderUsername:
            replyingTo.sender?.username ||
            "Unknown",
          content: replyingTo.content || "",
          messageType:
            replyingTo.messageType || "text",
        },
      }),
    };

    setContent("");
    onCancelReply?.();
    setUploading(true);

    setMessages((prev) => [
      ...prev,
      optimisticMessage,
    ]);

    try {
      const message = await sendMessageWithFile(
        selectedChat._id,
        file,
        caption,
        replyToMessageId
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? message : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== tempId)
      );

      setContent(caption);

      alert(
        error.response?.data?.message ||
        "Could not send file"
      );

      console.error(error);
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent || uploading) return;

    if (editingMessage) {
      await saveEdit(trimmedContent);
      return;
    }

    await sendTextMessage(trimmedContent);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading || editingMessage) {
      return;
    }

    await sendFileMessage(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isEditing = Boolean(editingMessage);

  return (
    <form
      className="message-form"
      onSubmit={handleSubmit}
    >
      {replyingTo && !isEditing && (
        <MessageReplyPreview
          replyTo={{
            senderUsername:
              replyingTo.sender?.username ||
              "Unknown",
            content: replyingTo.content,
            messageType:
              replyingTo.messageType || "text",
          }}
          variant="composer"
          onCancel={onCancelReply}
        />
      )}

      {isEditing && (
        <div className="composer-reply-bar composer-edit-bar">
          <div className="composer-reply-content">
            <span className="composer-reply-label">
              Editing message
            </span>
          </div>

          <button
            type="button"
            className="composer-reply-cancel"
            onClick={onCancelEdit}
            aria-label="Cancel edit"
          >
            ×
          </button>
        </div>
      )}

      <div className="message-form-row">
        <div
          className="message-input-wrap"
          ref={pickerRef}
        >
          <button
            type="button"
            className="attach-btn"
            disabled={uploading || isEditing}
            onClick={() =>
              fileInputRef.current?.click()
            }
            aria-label="Attach file"
          >
            📎
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="message-file-input"
            accept={ACCEPTED_FILES}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="emoji-btn"
            disabled={uploading}
            onClick={() =>
              setShowEmojiPicker((prev) => !prev)
            }
            aria-label="Add emoji"
          >
            😊
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker-popover">
              <EmojiPicker
                onEmojiClick={insertEmoji}
                width="100%"
                height={360}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            placeholder={
              isEditing
                ? "Edit your message..."
                : "Type a message..."
            }
            value={content}
            disabled={uploading}
            onChange={(e) =>
              setContent(e.target.value)
            }
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
        >
          {uploading
            ? "..."
            : isEditing
              ? "Save"
              : "Send"}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
