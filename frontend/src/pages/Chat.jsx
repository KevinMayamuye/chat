import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

import "../styles/chat.css";

const Chat = () => {
  return (
    <div className="chat-container">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
};

export default Chat;