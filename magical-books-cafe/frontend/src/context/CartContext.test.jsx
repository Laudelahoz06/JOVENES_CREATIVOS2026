import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartProvider, useCart } from "./CartContext";

const STORAGE_KEY = "magical_cart";

function buildProduct(overrides = {}) {
    return {
        _id: "prod-1",
        name: "Latte de vainilla",
        price: 12000,
        stock: 5,
        type: "coffee",
        image: "/latte.png",
        ...overrides
    };
}

function renderCart() {
    return renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>
    });
}

describe("CartContext", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("arranca vacío sin carrito guardado", () => {
        const { result } = renderCart();

        expect(result.current.items).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.total).toBe(0);
    });

    it("recupera el carrito persistido en localStorage", () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([
                {
                    product: "prod-1",
                    name: "Latte de vainilla",
                    price: 12000,
                    stock: 5,
                    format: null,
                    quantity: 2
                }
            ])
        );

        const { result } = renderCart();

        expect(result.current.items).toHaveLength(1);
        expect(result.current.count).toBe(2);
        expect(result.current.total).toBe(24000);
    });

    it("ignora un carrito guardado con formato inválido", () => {
        localStorage.setItem(STORAGE_KEY, "{no-es-json");

        const { result } = renderCart();

        expect(result.current.items).toEqual([]);
    });

    it("agrega un producto y lo persiste", () => {
        const { result } = renderCart();

        let response;

        act(() => {
            response = result.current.addItem(buildProduct(), 2);
        });

        expect(response).toEqual({
            ok: true,
            message: "Latte de vainilla se agregó al carrito."
        });
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toMatchObject({
            product: "prod-1",
            quantity: 2,
            price: 12000
        });
        expect(result.current.count).toBe(2);
        expect(result.current.total).toBe(24000);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
    });

    it("acumula unidades del mismo producto y formato", () => {
        const { result } = renderCart();
        const product = buildProduct();

        act(() => {
            result.current.addItem(product, 1);
        });

        act(() => {
            result.current.addItem(product, 2);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(3);
        expect(result.current.count).toBe(3);
    });

    it("separa el mismo producto con distinto formato", () => {
        const { result } = renderCart();
        const product = buildProduct();

        act(() => {
            result.current.addItem(product, 1, "digital");
        });

        act(() => {
            result.current.addItem(product, 1, "fisico");
        });

        expect(result.current.items).toHaveLength(2);
        expect(result.current.count).toBe(2);
    });

    it("no agrega productos agotados", () => {
        const { result } = renderCart();

        let response;

        act(() => {
            response = result.current.addItem(buildProduct({ stock: 0 }), 1);
        });

        expect(response.ok).toBe(false);
        expect(response.message).toContain("agotado");
        expect(result.current.items).toEqual([]);
    });

    it("limita la cantidad al stock disponible", () => {
        const { result } = renderCart();

        act(() => {
            result.current.addItem(buildProduct({ stock: 2 }), 2);
        });

        let response;

        act(() => {
            response = result.current.addItem(buildProduct({ stock: 2 }), 1);
        });

        expect(response).toEqual({
            ok: false,
            message: "Solo hay 2 disponibles de Latte de vainilla."
        });
        expect(result.current.items[0].quantity).toBe(2);
    });

    it("actualiza la cantidad respetando el stock", () => {
        const { result } = renderCart();

        act(() => {
            result.current.addItem(buildProduct({ stock: 5 }), 2);
        });

        act(() => {
            result.current.updateQuantity("prod-1", null, 10);
        });

        expect(result.current.items[0].quantity).toBe(5);
        expect(result.current.count).toBe(5);
    });

    it("mantiene al menos una unidad al actualizar la cantidad", () => {
        const { result } = renderCart();

        act(() => {
            result.current.addItem(buildProduct(), 2);
        });

        act(() => {
            result.current.updateQuantity("prod-1", null, 0);
        });

        expect(result.current.items[0].quantity).toBe(1);
    });

    it("elimina solo el producto y formato indicados", () => {
        const { result } = renderCart();
        const product = buildProduct();

        act(() => {
            result.current.addItem(product, 1);
        });

        act(() => {
            result.current.addItem(product, 1, "digital");
        });

        act(() => {
            result.current.removeItem("prod-1", null);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].format).toBe("digital");
    });

    it("vacía el carrito y el almacenamiento", () => {
        const { result } = renderCart();

        act(() => {
            result.current.addItem(buildProduct(), 1);
        });

        act(() => {
            result.current.clearCart();
        });

        expect(result.current.items).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEY)).toBe("[]");
    });

    it("lanza un error si se usa fuera del proveedor", () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(() => renderHook(() => useCart())).toThrow(
            "useCart debe utilizarse dentro de CartProvider."
        );

        consoleError.mockRestore();
    });
});
