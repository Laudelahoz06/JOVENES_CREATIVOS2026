import { describe, expect, it } from "vitest";

import {
    formatCOP,
    formatDate,
    ORDER_STATUS_LABELS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    PRODUCT_FORMAT_LABELS,
    RENTAL_STATUS_LABELS
} from "./format";

describe("formatCOP", () => {
    it("formatea pesos sin decimales con separador de miles", () => {
        const value = formatCOP(1234567);

        expect(value).toContain("1.234.567");
        expect(value).not.toContain(",00");
    });

    it("trata valores nulos como cero", () => {
        expect(formatCOP(null)).toBe(formatCOP(0));
        expect(formatCOP(undefined)).toBe(formatCOP(0));
    });
});

describe("formatDate", () => {
    it("devuelve un guion cuando no hay fecha", () => {
        expect(formatDate(null)).toBe("—");
        expect(formatDate("")).toBe("—");
    });

    it("incluye el año de la fecha recibida", () => {
        expect(formatDate("2026-11-12T12:00:00.000Z")).toContain("2026");
    });
});

describe("etiquetas", () => {
    it("cubre todos los formatos de producto", () => {
        expect(PRODUCT_FORMAT_LABELS).toEqual({
            fisico: "Físico",
            digital: "Digital",
            kindle: "Kindle",
            local_pc: "PC local"
        });
    });

    it("cubre los estados de pedido y alquiler", () => {
        expect(ORDER_STATUS_LABELS.cancelado).toBe("Cancelado");
        expect(RENTAL_STATUS_LABELS.pending).toBe("Pendiente");
        expect(RENTAL_STATUS_LABELS.active).toBe("Activo");
    });

    it("cubre métodos y estados de pago", () => {
        expect(PAYMENT_METHOD_LABELS).toEqual({
            wompi: "Wompi (online)",
            local: "En el local"
        });

        expect(PAYMENT_STATUS_LABELS).toEqual({
            pending: "Pago pendiente",
            approved: "Pagado",
            rejected: "Pago rechazado"
        });
    });
});
