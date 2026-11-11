const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...(token && {
                Authorization: `Bearer ${token}`
            }),
            ...options.headers
        }
    });

    // Algunas respuestas pueden no tener contenido.
        const data = response.status === 204
            ? null
            : await response.json();

        if (!response.ok) {
            throw new Error(
                data?.message || "Error en la solicitud"
            );
        }

        return data;

    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                "No se pudo conectar con el servidor. Verifica que el backend esté activo.",
                { cause: error }
            );
        }

        throw error;        
    }

}