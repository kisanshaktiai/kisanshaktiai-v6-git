
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import { CustomAuthProvider } from "@/hooks/useCustomAuth";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CustomAuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CustomAuthProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
