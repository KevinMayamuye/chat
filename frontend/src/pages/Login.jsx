import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";

import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

import "../styles/auth.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const { user, login } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.detail.value ?? "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(formData);

      login(data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="auth-content ion-padding"
      >
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <h2>Login</h2>

          <IonList lines="full">
            <IonItem>
              <IonInput
                type="email"
                label="Email"
                labelPlacement="stacked"
                placeholder="Email"
                value={formData.email}
                onIonInput={handleChange("email")}
                required
              />
            </IonItem>

            <IonItem>
              <IonInput
                type="password"
                label="Password"
                labelPlacement="stacked"
                placeholder="Password"
                value={formData.password}
                onIonInput={handleChange("password")}
                required
              />
            </IonItem>
          </IonList>

          <IonButton
            expand="block"
            type="submit"
          >
            Login
          </IonButton>

          <IonText className="auth-link">
            <p>
              Don't have an account?{" "}
              <Link to="/register">
                Register
              </Link>
            </p>
          </IonText>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;
