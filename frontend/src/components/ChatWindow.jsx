import MessageInput from "./MessageInput";

const ChatWindow = () => {
  return (
    <div className="chat-window">

      <div className="messages">

        <div className="message sent">
          Hello
        </div>

        <div className="message received">
          Hi there
        </div>

      </div>

      <MessageInput />

    </div>
  );
};

export default ChatWindow;