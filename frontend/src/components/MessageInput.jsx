import { useState } from "react";

const MessageInput = () => {

  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(message);

    setMessage("");
  };

  return (
    <form
      className="message-form"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
      />

      <button type="submit">
        Send
      </button>
    </form>
  );
};

export default MessageInput;