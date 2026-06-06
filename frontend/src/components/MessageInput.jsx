import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { sendMessage } from "../services/messageService";

const MessageInput = ({
  selectedChat,
  setMessages,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const tempId = `temp-${crypto.randomUUID()}`;

    const optimisticMessage = {
      _id: tempId,
      content: trimmedContent,
      sender: {
        _id: user._id,
        username: user.username,
      },
      chat: selectedChat._id,
      readBy: [user._id],
      deliveredTo: [],
      pending: true,
    };

    setContent("");

    setMessages((prev) => [
      ...prev,
      optimisticMessage,
    ]);

    try {
      const message = await sendMessage(
        selectedChat._id,
        trimmedContent
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

      console.error(error);
    }
  };

  return (
    <form
      className="message-form"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={content}
        onChange={(e) =>
          setContent(e.target.value)
        }
      />

      <button type="submit">
        Send
      </button>
    </form>
  );
};

export default MessageInput;
