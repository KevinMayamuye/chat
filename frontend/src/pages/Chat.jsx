import { useEffect } from "react";

import { IonPage, IonContent } from "@ionic/react";

import "../styles/chat.css";

import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { socket } from "../socket/socket";

const Chat = () => {
  const { user } = useAuth();
  const { selectedChat } = useChat();

  useEffect(() => {
    if (!user?.token) {
      socket.disconnect();
      return;
    }

    socket.auth = { token: user.token };

    if (!socket.connected) {
      socket.connect();
    }

    const onConnected = () => {
      console.log("Socket connected");
    };

    socket.on("connected", onConnected);

    return () => {
      socket.off("connected", onConnected);
      socket.disconnect();
    };
  }, [user?.token]);

  return (
    <IonPage>
      <IonContent
        fullscreen
        scrollY={false}
        className="chat-page-content"
      >
        <div
          className={`chat-container ${
            selectedChat
              ? "show-conversation"
              : "show-list"
          }`}
        >
          <ChatSidebar />

          <ChatWindow />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Chat;
