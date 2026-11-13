import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.hoisted(() => vi.fn());

vi.mock("../context/AuthContext", () => ({
    useAuth: () => ({ login: loginMock })
}));

import Login from "./Login";

function renderLogin() {
    return render(
        <MemoryRouter initialEntries={["/iniciar-sesion"]}>
            <Routes>
                <Route path="/iniciar-sesion" element={<Login />} />
                <Route path="/" element={<div>página inicio</div>} />
                <Route path="/admin" element={<div>panel admin</div>} />
            </Routes>
        </MemoryRouter>
    );
}

async function completeForm(user, email = "ana@example.com") {
    await user.type(screen.getByLabelText("Correo electrónico"), email);
    await user.type(screen.getByLabelText("Contraseña"), "secreta123");
}

describe("Login", () => {
    beforeEach(() => {
        loginMock.mockReset();
    });

    it("renderiza el formulario y el enlace de registro", () => {
        renderLogin();

        expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
        expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /iniciar sesión/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /crear una cuenta/i })
        ).toHaveAttribute("href", "/registro");
    });

    it("envía las credenciales recortando el correo", async () => {
        const user = userEvent.setup();

        loginMock.mockResolvedValue({ user: { role: "customer" } });

        renderLogin();
        await completeForm(user, "ana@example.com ");

        await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        expect(loginMock).toHaveBeenCalledWith({
            email: "ana@example.com",
            password: "secreta123"
        });
        expect(await screen.findByText("página inicio")).toBeInTheDocument();
    });

    it("lleva al administrador directo al panel", async () => {
        const user = userEvent.setup();

        loginMock.mockResolvedValue({ user: { role: "admin" } });

        renderLogin();
        await completeForm(user);
        await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        expect(await screen.findByText("panel admin")).toBeInTheDocument();
    });

    it("muestra el error cuando el login falla", async () => {
        const user = userEvent.setup();

        loginMock.mockRejectedValue(new Error("Credenciales inválidas"));

        renderLogin();
        await completeForm(user);
        await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

        const alert = await screen.findByRole("alert");

        expect(alert).toHaveTextContent("Credenciales inválidas");
        expect(loginMock).toHaveBeenCalledTimes(1);
    });

    it("alterna la visibilidad de la contraseña", async () => {
        const user = userEvent.setup();

        renderLogin();

        const password = screen.getByLabelText("Contraseña");

        expect(password).toHaveAttribute("type", "password");

        await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));

        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));

        expect(password).toHaveAttribute("type", "password");
    });
});
