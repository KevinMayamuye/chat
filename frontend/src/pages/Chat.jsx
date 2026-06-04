import { useEffect } from "react";
import "../styles/chat.css";

import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

import { useAuth } from "../context/AuthContext";

import { socket } from "../socket/socket";

const Chat = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    socket.connect();

    socket.emit(
      "setup",
      user._id
    );

    socket.on(
      "connected",
      () => {
        console.log(
          "Socket connected"
        );
      }
    );

    return () => {
      socket.off("connected");

      socket.disconnect();
    };

  }, [user]);

  return (
    <div className="chat-container">
      <ChatSidebar />

      <ChatWindow />
    </div>
  );
};

export default Chat;