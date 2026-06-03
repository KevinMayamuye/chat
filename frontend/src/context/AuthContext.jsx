import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);


  // Load user from localStorage
  useEffect(() => {

    const storedUser = localStorage.getItem("userInfo");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

  }, []);


  // LOGIN
  const login = (userData) => {

    localStorage.setItem(
      "userInfo",
      JSON.stringify(userData)
    );

    setUser(userData);
  };


  // LOGOUT
  const logout = () => {

    localStorage.removeItem("userInfo");

    setUser(null);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        login,
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