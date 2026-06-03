import { useEffect, useState } from "react";

import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getMessages } from "../services/messageService";
import MessageInput from "./MessageInput";

const ChatWindow = () => {

  const { user } =
    useAuth();

  const {
    selectedChat
  } = useChat();

  const [
    messages,
    setMessages
  ] = useState([]);

  useEffect(() => {

    if (selectedChat) {
      fetchMessages();
    }

  }, [selectedChat]);

  const fetchMessages =
    async () => {

      try {

        const data =
          await getMessages(
            selectedChat._id,
            user.token
          );

        setMessages(data);

      } catch (error) {

        console.error(error);
      }
  };

  if (!selectedChat) {
    return (
      <div
        className="chat-window"
      >
        Select a user
      </div>
    );
  }

  return (
    <div className="chat-window">

      <div className="messages">

        {messages.map(
          (message) => (

          <div
            key={message._id}
            className={
              message.sender._id ===
              user._id
              ? "message sent"
              : "message received"
            }
          >
            {message.content}
          </div>

        ))}
      </div>

      <MessageInput
        selectedChat={
          selectedChat
        }
        messages={messages}
        setMessages={
          setMessages
        }
      />

    </div>
  );
};

export default ChatWindow;