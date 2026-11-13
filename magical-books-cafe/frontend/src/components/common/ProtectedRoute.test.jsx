import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("../../context/AuthContext", () => ({
    useAuth: mockUseAuth
}));

import ProtectedRoute from "./ProtectedRoute";

function renderRoute(allowedRoles = []) {
    render(
        <MemoryRouter initialEntries={["/privado"]}>
            <Routes>
                <Route
                    path="/privado"
                    element={
                        <ProtectedRoute allowedRoles={allowedRoles}>
                            <div>contenido privado</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/iniciar-sesion" element={<div>página login</div>} />
                <Route path="/" element={<div>página inicio</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("ProtectedRoute", () => {
    beforeEach(() => {
        mockUseAuth.mockReset();
    });

    it("muestra la verificación mientras carga la sesión", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            isAuthenticated: false,
            loading: true
        });

        renderRoute();

        expect(screen.getByText("Verificando permisos...")).toBeInTheDocument();
    });

    it("redirige al login sin sesión", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            isAuthenticated: false,
            loading: false
        });

        renderRoute();

        expect(screen.getByText("página login")).toBeInTheDocument();
    });

    it("redirige al inicio si el rol no está permitido", () => {
        mockUseAuth.mockReturnValue({
            user: { role: "customer" },
            isAuthenticated: true,
            loading: false
        });

        renderRoute(["admin"]);

        expect(screen.getByText("página inicio")).toBeInTheDocument();
    });

    it("muestra el contenido con sesión válida", () => {
        mockUseAuth.mockReturnValue({
            user: { role: "customer" },
            isAuthenticated: true,
            loading: false
        });

        renderRoute();

        expect(screen.getByText("contenido privado")).toBeInTheDocument();
    });

    it("muestra el contenido si el rol está permitido", () => {
        mockUseAuth.mockReturnValue({
            user: { role: "admin" },
            isAuthenticated: true,
            loading: false
        });

        renderRoute(["admin"]);

        expect(screen.getByText("contenido privado")).toBeInTheDocument();
    });
});
