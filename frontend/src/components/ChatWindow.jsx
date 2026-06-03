import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { getMessages } from "../services/messageService";

import { socket } from "../../../backend/socket/socket";

import MessageInput from "./MessageInput";

const ChatWindow = () => {
  const { user } = useAuth();

  const { selectedChat } = useChat();

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    socket.on(
      "newMessage",
      (message) => {

        setMessages((prev) => {
          const exists = prev.some(
            (msg) => msg._id === message._id
          );

          if (exists) {
            return prev;
          }

          return [...prev, message];
        });

      }
    );

    return () => {
      socket.off("newMessage");
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await getMessages(
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
      <div className="chat-window">
        <div
          style={{
            margin: "auto",
            fontSize: "20px"
          }}
        >
          Select a user to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((message) => (
          <div
            key={message._id}
            className={
              message.sender._id === user._id
                ? "message sent"
                : "message received"
            }
          >
            {message.content}
          </div>
        ))}
      </div>

      <MessageInput
        selectedChat={selectedChat}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
};

export default ChatWindow;