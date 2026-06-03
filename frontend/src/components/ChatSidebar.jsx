import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const users = [
  {
    id: 1,
    username: "John"
  },
  {
    id: 2,
    username: "Mary"
  },
  {
    id: 3,
    username: "Peter"
  }
];

const ChatSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          key={chatUser.id}
          className="user-item"
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