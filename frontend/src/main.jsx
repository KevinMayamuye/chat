import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import { IonApp, setupIonicReact } from "@ionic/react";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

import { initNativePlatform } from "./utils/initNative";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";
import "./styles/ionic.css";

setupIonicReact();

initNativePlatform();

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <IonApp>
      <HashRouter>
        <AuthProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </AuthProvider>
      </HashRouter>
    </IonApp>
  </React.StrictMode>
);
