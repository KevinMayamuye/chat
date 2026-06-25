import { useRef, useState, useEffect } from "react";
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

import Avatar from "../components/Avatar";

import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/authService";
import { updateMyProfile } from "../services/userService";
import { resizeImageToBase64 } from "../utils/resizeImage";

import "../styles/auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [avatarPreview, setAvatarPreview] =
    useState(null);
  const [avatarFile, setAvatarFile] =
    useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { user, login, updateUser } = useAuth();

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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await registerUser(formData);

      login(data);

      if (avatarFile) {
        const profilePicture =
          await resizeImageToBase64(avatarFile);

        const updated = await updateMyProfile({
          profilePicture,
        });

        updateUser({
          profilePicture: updated.profilePicture,
        });
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        error.message ||
        "Registration failed"
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
          <h2>Register</h2>

          <div className="profile-avatar-section register-avatar-section">
            <Avatar
              user={{
                username: formData.username || "?",
                profilePicture: avatarPreview,
              }}
              size="lg"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handleAvatarChange}
            />

            <IonButton
              fill="outline"
              size="small"
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              {avatarPreview
                ? "Change photo"
                : "Add profile photo (optional)"}
            </IonButton>
          </div>

          <IonList lines="full">
            <IonItem>
              <IonInput
                type="text"
                label="Username"
                labelPlacement="stacked"
                placeholder="Username"
                value={formData.username}
                onIonInput={handleChange("username")}
                minlength={2}
                required
              />
            </IonItem>

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
                minlength={6}
                required
              />
            </IonItem>
          </IonList>

          <IonButton
            expand="block"
            type="submit"
          >
            Register
          </IonButton>

          <IonText className="auth-link">
            <p>
              Already have an account?{" "}
              <Link to="/">
                Login
              </Link>
            </p>
          </IonText>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register;
