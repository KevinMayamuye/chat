import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { getUsers } from "../services/userService";
import { createChat } from "../services/chatService";

const ChatSidebar = () => {
  const { user, logout } = useAuth();

  const { setSelectedChat } = useChat();

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();

      const filteredUsers = data.filter(
        (u) => u._id !== user._id
      );

      setUsers(filteredUsers);

    } catch (error) {
      console.error(error);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const chat = await createChat(
        userId,
        user.token
      );

      console.log("Chat opened:", chat);

      setSelectedChat(chat);

    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();

    navigate("/");
  };

  return (
    <div className="sidebar">
      <h2>Chats</h2>

      <p>Logged in as:</p>

      <h3>{user?.username}</h3>

      {users.map((chatUser) => (
        <div
          key={chatUser._id}
          className="user-item"
          onClick={() =>
            handleUserClick(chatUser._id)
          }
        >
          {chatUser.username}
        </div>
      ))}

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "10px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default ChatSidebar;