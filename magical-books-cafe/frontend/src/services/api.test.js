import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";

function mockFetch(response) {
    const fetchMock = vi.fn().mockResolvedValue(response);

    vi.stubGlobal("fetch", fetchMock);

    return fetchMock;
}

function jsonResponse({ ok = true, status = 200, body = {} } = {}) {
    return {
        ok,
        status,
        json: vi.fn().mockResolvedValue(body)
    };
}

describe("apiRequest", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("llama a la URL base con content-type JSON", async () => {
        const fetchMock = mockFetch(jsonResponse({ body: { ok: true } }));

        const data = await apiRequest("/products");

        expect(data).toEqual({ ok: true });

        const [url, options] = fetchMock.mock.calls[0];

        expect(url).toMatch(/\/api\/products$/);
        expect(options.headers["Content-Type"]).toBe("application/json");
        expect(options.headers.Authorization).toBeUndefined();
    });

    it("adjunta el token cuando existe una sesión", async () => {
        localStorage.setItem("token", "token-123");

        const fetchMock = mockFetch(jsonResponse());

        await apiRequest("/auth/profile");

        const [, options] = fetchMock.mock.calls[0];

        expect(options.headers.Authorization).toBe("Bearer token-123");
    });

    it("respeta cabeceras adicionales", async () => {
        const fetchMock = mockFetch(jsonResponse());

        await apiRequest("/orders", { headers: { "X-Test": "1" } });

        const [, options] = fetchMock.mock.calls[0];

        expect(options.headers["X-Test"]).toBe("1");
    });

    it("devuelve null en respuestas 204 sin cuerpo", async () => {
        mockFetch(jsonResponse({ status: 204 }));

        await expect(apiRequest("/orders/1")).resolves.toBeNull();
    });

    it("propaga el mensaje de error del backend", async () => {
        mockFetch(
            jsonResponse({
                ok: false,
                status: 400,
                body: { message: "Datos inválidos" }
            })
        );

        await expect(apiRequest("/orders")).rejects.toThrow("Datos inválidos");
    });

    it("usa un mensaje genérico si el backend no lo envía", async () => {
        mockFetch(jsonResponse({ ok: false, status: 500, body: {} }));

        await expect(apiRequest("/orders")).rejects.toThrow(
            "Error en la solicitud"
        );
    });

    it("envuelve los errores de red con un mensaje claro", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
        );

        await expect(apiRequest("/products")).rejects.toThrow(
            "No se pudo conectar con el servidor. Verifica que el backend esté activo."
        );
    });
});
