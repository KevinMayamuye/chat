import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "../services/api";
import { socket } from "../socket/socket";
import { isTokenExpired } from "../utils/token";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      socket.disconnect();
      setUser(null);
      navigate("/", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("userInfo");

    if (!storedUser) return;

    const parsed = JSON.parse(storedUser);

    if (
      !parsed.token ||
      isTokenExpired(parsed.token)
    ) {
      localStorage.removeItem("userInfo");
      return;
    }

    setUser(parsed);
  }, []);

  const login = (userData) => {
    localStorage.setItem(
      "userInfo",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      const updated = { ...prev, ...partial };

      localStorage.setItem(
        "userInfo",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("userInfo");

    socket.disconnect();

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
