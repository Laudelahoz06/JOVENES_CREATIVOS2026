import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { CartProvider, useCart } from "../../context/CartContext";
import ProductCard from "./ProductCard";

const baseProduct = {
    _id: "prod-1",
    name: "Latte de vainilla",
    category: "Cafés",
    price: 12000,
    stock: 5,
    image: "/latte.png",
    formats: []
};

function CartProbe() {
    const { count, items } = useCart();

    return (
        <div data-testid="cart-probe">
            {count}|{items[0]?.format ?? "sin-formato"}
        </div>
    );
}

function renderCard(product = baseProduct) {
    return render(
        <MemoryRouter>
            <CartProvider>
                <ProductCard product={product} />
                <CartProbe />
            </CartProvider>
        </MemoryRouter>
    );
}

describe("ProductCard", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("muestra la información del producto", () => {
        renderCard();

        expect(screen.getByText("Latte de vainilla")).toBeInTheDocument();
        expect(screen.getByText("Cafés")).toBeInTheDocument();
        expect(screen.getByText(/12\.000/)).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /ver producto/i })
        ).toHaveAttribute("href", "/catalogo/prod-1");
    });

    it("añade el producto al carrito y muestra confirmación", async () => {
        const user = userEvent.setup();

        renderCard();

        await user.click(screen.getByRole("button", { name: /añadir/i }));

        expect(screen.getByTestId("cart-probe")).toHaveTextContent("1|sin-formato");
        expect(
            screen.getByText("Latte de vainilla se agregó al carrito.")
        ).toBeInTheDocument();
    });

    it("usa el único formato disponible al añadir", async () => {
        const user = userEvent.setup();

        renderCard({ ...baseProduct, formats: ["digital"] });

        await user.click(screen.getByRole("button", { name: /añadir/i }));

        expect(screen.getByTestId("cart-probe")).toHaveTextContent("1|digital");
    });

    it("deshabilita la compra cuando no hay stock", () => {
        renderCard({ ...baseProduct, stock: 0 });

        const button = screen.getByRole("button", { name: "Agotado" });

        expect(button).toBeDisabled();
    });
});
