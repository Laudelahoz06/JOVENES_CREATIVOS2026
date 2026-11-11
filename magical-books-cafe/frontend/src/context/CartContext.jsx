import { createContext, useContext, useMemo, useState } from "react";

// Carrito de compras persistido en localStorage.
const CartContext = createContext(null);

const STORAGE_KEY = "magical_cart";

const itemKey = (product, format) => `${product}_${format || "sin-formato"}`;

const readStoredCart = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
};

export function CartProvider({ children }) {
    const [items, setItems] = useState(readStoredCart);

    const save = (nextItems) => {
        setItems(nextItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    };

    const addItem = (product, quantity = 1, format = null) => {
        const requested = Math.max(1, Number(quantity) || 1);
        const stock = Number(product.stock);
        const key = itemKey(product._id, format);

        if (!Number.isFinite(stock) || stock <= 0) {
            return {
                ok: false,
                message: `${product.name} está agotado por el momento.`
            };
        }

        const existing = items.find(
            (item) => itemKey(item.product, item.format) === key
        );
        const currentQuantity = existing ? existing.quantity : 0;

        if (currentQuantity + requested > stock) {
            return {
                ok: false,
                message: `Solo hay ${stock} disponibles de ${product.name}.`
            };
        }

        const next = existing
            ? items.map((item) =>
                itemKey(item.product, item.format) === key
                    ? { ...item, quantity: currentQuantity + requested }
                    : item
            )
            : [
                ...items,
                {
                    product: product._id,
                    name: product.name,
                    price: Number(product.price),
                    image: product.image || product.imageUrl || "",
                    type: product.type,
                    stock,
                    format,
                    quantity: requested
                }
            ];

        save(next);

        return {
            ok: true,
            message: `${product.name} se agregó al carrito.`
        };
    };

    const removeItem = (product, format = null) => {
        save(
            items.filter(
                (item) => itemKey(item.product, item.format) !== itemKey(product, format)
            )
        );
    };

    const updateQuantity = (product, format, quantity) => {
        const target = Math.max(1, Number(quantity) || 1);
        const key = itemKey(product, format);
        const item = items.find(
            (entry) => itemKey(entry.product, entry.format) === key
        );

        if (!item) return;

        const nextQuantity =
            typeof item.stock === "number" && item.stock > 0
                ? Math.min(target, item.stock)
                : target;

        save(
            items.map((entry) =>
                itemKey(entry.product, entry.format) === key
                    ? { ...entry, quantity: nextQuantity }
                    : entry
            )
        );
    };

    const clearCart = () => save([]);

    const { count, total } = useMemo(
        () =>
            items.reduce(
                (accumulator, item) => ({
                    count: accumulator.count + item.quantity,
                    total: accumulator.total + item.price * item.quantity
                }),
                { count: 0, total: 0 }
            ),
        [items]
    );

    const value = useMemo(
        () => ({
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            count,
            total
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [items, count, total]
    );

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart debe utilizarse dentro de CartProvider.");
    }

    return context;
}
