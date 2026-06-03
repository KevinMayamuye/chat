import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      <h3>
        Welcome {user?.username}
      </h3>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;