import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonButton,
  IonText,
} from "@ionic/react";

import Avatar from "../components/Avatar";

import { useAuth } from "../context/AuthContext";
import { updateMyProfile } from "../services/userService";
import { resizeImageToBase64 } from "../utils/resizeImage";

import "../styles/auth.css";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const profilePicture =
        await resizeImageToBase64(file);

      const updated = await updateMyProfile({
        profilePicture,
      });

      updateUser({
        profilePicture: updated.profilePicture,
      });
    } catch (err) {
      setError(
        err.message ||
        err.response?.data?.message ||
        "Could not upload photo"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setError("");

    try {
      const updated = await updateMyProfile({
        profilePicture: null,
      });

      updateUser({
        profilePicture: updated.profilePicture,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not remove photo"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/chat"
              text="Chats"
            />
          </IonButtons>
          <IonTitle>My Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="auth-content ion-padding"
      >
        <div className="auth-form profile-form">
          <div className="profile-avatar-section">
            <Avatar user={user} size="lg" />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handleFileChange}
            />

            <div className="profile-avatar-actions">
              <IonButton
                expand="block"
                disabled={uploading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                {uploading
                  ? "Uploading..."
                  : "Change photo"}
              </IonButton>

              {user?.profilePicture && (
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  disabled={uploading}
                  onClick={handleRemovePhoto}
                >
                  Remove photo
                </IonButton>
              )}
            </div>
          </div>

          <div className="profile-field">
            <label>Username</label>
            <p>{user?.username}</p>
          </div>

          <div className="profile-field">
            <label>Email</label>
            <p>{user?.email}</p>
          </div>

          {error && (
            <IonText color="danger">
              <p className="profile-error">
                {error}
              </p>
            </IonText>
          )}

          <IonButton
            expand="block"
            color="medium"
            onClick={() => navigate("/chat")}
          >
            Back to chats
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
