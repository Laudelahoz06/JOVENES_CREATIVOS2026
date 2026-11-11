
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { apiRequest } from "../services/api";

// Creamos el contexto
const AuthContext = createContext(null);

// Proveedor de autenticación
export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(
        () => Boolean(localStorage.getItem("token"))
    );

    // Recuperar la sesión cuando se carga la aplicación
    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        let cancelled = false;

        const loadProfile = async () => {
            try {
                const data = await apiRequest("/auth/profile");

                if (!cancelled) {
                    setUser(data.user);
                }

            } catch {
                localStorage.removeItem("token");

                if (!cancelled) {
                    setUser(null);
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };

    }, []);

    // Iniciar sesión
    const login = async (credentials) => {

        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials)
        });

        localStorage.setItem("token", data.token);
        setUser(data.user);

        return data;
    };

    // Registrar usuario
    const register = async (userData) => {

        const data = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData)
        });

        localStorage.setItem("token", data.token);
        setUser(data.user);

        return data;
    };

    // Cerrar sesión
    const logout = async () => {

        try {
            await apiRequest("/auth/logout", {
                method: "POST"
            });

        } finally {
            localStorage.removeItem("token");
            setUser(null);
        }
    };

    // Actualizar el usuario en memoria (tras editar el perfil).
    const updateUser = (nextUser) => {
        setUser(nextUser);
    };

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para utilizar la autenticación
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth debe utilizarse dentro de AuthProvider."
        );
    }

    return context;
}
