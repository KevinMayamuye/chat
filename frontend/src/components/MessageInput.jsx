import { useState } from "react";

import { useAuth } from "../context/AuthContext";

import { sendMessage } from "../services/messageService";

const MessageInput = ({
  selectedChat,
  messages,
  setMessages
}) => {
  const { user } = useAuth();

  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      const message = await sendMessage(
        selectedChat._id,
        content,
        user.token
      );

      setMessages([
        ...messages,
        message
      ]);

      setContent("");

    } catch (error) {
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