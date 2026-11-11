import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";


import "./styles/variables.css";
import "./styles/global.css";
import "./styles/features.css";
import "./styles/responsive.css";
import "./styles/auth.css";


ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <CartProvider>
                <App />
            </CartProvider>
        </AuthProvider>

    </React.StrictMode>
);
