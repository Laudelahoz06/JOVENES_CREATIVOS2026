import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import { formatCOP } from "../../utils/format";
import { sanitizeUrl } from "../../utils/url";
import ImagePreview from "../../components/admin/ImagePreview";

const EMPTY_FORM = {
    sku: "",
    name: "",
    description: "",
    type: "coffee",
    category: "",
    price: "",
    image: "",
    featured: false,
    formats: [],
    rentalEnabled: false,
    rentalDailyPrice: "",
    rentalMaxDays: "14"
};

const ALL_FORMATS = ["fisico", "digital", "kindle", "local_pc"];

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [activeSearch, setActiveSearch] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const [stockTarget, setStockTarget] = useState(null);
    const [stockForm, setStockForm] = useState({
        operation: "restock",
        quantity: "",
        reason: ""
    });
    const [stockSaving, setStockSaving] = useState(false);

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({ limit: "50" });

            if (activeSearch) params.set("search", activeSearch);

            const data = await apiRequest(
                `/admin/products?${params.toString()}`
            );

            setProducts(data.products || []);

        } catch (err) {
            setError(err.message || "No se pudieron cargar los productos.");
        } finally {
            setLoading(false);
        }
    }, [activeSearch]);

    useEffect(() => {
        const timer = window.setTimeout(loadProducts, 0);

        return () => window.clearTimeout(timer);
    }, [loadProducts]);

    const handleSearch = (event) => {
        event.preventDefault();
        setActiveSearch(search.trim());
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
        setFeedback(null);
    };

    const openEdit = (product) => {
        setEditingId(product._id);
        setForm({
            sku: product.sku || "",
            name: product.name || "",
            description: product.description || "",
            type: product.type || "coffee",
            category: product.category || "",
            price: String(product.price ?? ""),
            image: product.image || "",
            featured: Boolean(product.featured),
            formats: product.formats || [],
            rentalEnabled: Boolean(product.rental?.enabled),
            rentalDailyPrice: String(product.rental?.dailyPrice ?? ""),
            rentalMaxDays: String(product.rental?.maxDays ?? 14)
        });
        setFormOpen(true);
        setFeedback(null);
        setStockTarget(null);
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleFormatToggle = (format) => {
        setForm((previous) => ({
            ...previous,
            formats: previous.formats.includes(format)
                ? previous.formats.filter((item) => item !== format)
                : [...previous.formats, format]
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback(null);

        if (
            !form.sku.trim() ||
            !form.name.trim() ||
            !form.description.trim() ||
            !form.category.trim() ||
            form.price === ""
        ) {
            setFeedback({
                type: "error",
                message: "Completa todos los campos obligatorios."
            });
            return;
        }

        const payload = {
            sku: form.sku.trim().toUpperCase(),
            name: form.name.trim(),
            description: form.description.trim(),
            type: form.type,
            category: form.category.trim(),
            price: Number(form.price),
            image: sanitizeUrl(form.image),
            featured: form.featured,
            formats: form.type === "book" ? form.formats : [],
            rental: {
                enabled: form.type === "book" && form.rentalEnabled,
                dailyPrice:
                    form.type === "book" && form.rentalEnabled
                        ? Number(form.rentalDailyPrice || 0)
                        : 0,
                maxDays: Number(form.rentalMaxDays || 0)
            }
        };

        setSaving(true);

        try {
            if (editingId) {
                await apiRequest(`/admin/products/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                });

                setFeedback({
                    type: "success",
                    message: "Producto actualizado correctamente."
                });

            } else {
                await apiRequest("/admin/products", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                setFeedback({
                    type: "success",
                    message:
                        "Producto creado. Ahora registra su inventario con " +
                        '"Reponer" en la tabla.'
                });
            }

            setFormOpen(false);
            setEditingId(null);
            await loadProducts();

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo guardar el producto."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (product) => {
        setFeedback(null);

        try {
            await apiRequest(`/admin/products/${product._id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ active: !product.active })
            });

            await loadProducts();

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo cambiar el estado."
            });
        }
    };

    const handleStockSubmit = async (event) => {
        event.preventDefault();

        if (!stockTarget) return;

        setStockSaving(true);
        setFeedback(null);

        try {
            await apiRequest(`/admin/products/${stockTarget._id}/stock`, {
                method: "PATCH",
                body: JSON.stringify({
                    operation: stockForm.operation,
                    quantity: Number(stockForm.quantity),
                    reason: stockForm.reason.trim()
                })
            });

            setStockTarget(null);
            setStockForm({ operation: "restock", quantity: "", reason: "" });
            await loadProducts();

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo actualizar el inventario."
            });
        } finally {
            setStockSaving(false);
        }
    };

    return (
        <div className="admin-panel">

            <div className="admin-toolbar">

                <form
                    className="admin-search"
                    onSubmit={handleSearch}
                >
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nombre, SKU o categoría..."
                        aria-label="Buscar productos"
                    />

                    <button type="submit" className="btn-secondary">
                        Buscar
                    </button>

                    {activeSearch && (
                        <button
                            type="button"
                            className="admin-link-button"
                            onClick={() => {
                                setSearch("");
                                setActiveSearch("");
                            }}
                        >
                            Limpiar
                        </button>
                    )}
                </form>

                <button type="button" className="btn-primary" onClick={openCreate}>
                    Nuevo producto ✦
                </button>

            </div>

            {feedback && (
                <div
                    className={`form-feedback form-feedback-${feedback.type}`}
                    role="alert"
                >
                    <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
                    {feedback.message}
                </div>
            )}

            {formOpen && (
                <form className="admin-form" onSubmit={handleSubmit} noValidate>

                    <div className="admin-form-header">
                        <h3>
                            {editingId
                                ? "Editar producto"
                                : "Nuevo producto"}
                        </h3>

                        <button
                            type="button"
                            className="admin-link-button"
                            onClick={() => {
                                setFormOpen(false);
                                setEditingId(null);
                            }}
                        >
                            Cancelar
                        </button>
                    </div>

                    <div className="admin-form-grid">

                        <label>
                            SKU *
                            <input
                                name="sku"
                                type="text"
                                value={form.sku}
                                onChange={handleChange}
                                placeholder="LIB-003"
                                disabled={Boolean(editingId)}
                            />
                        </label>

                        <label>
                            Nombre *
                            <input
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Nombre del producto"
                            />
                        </label>

                        <label>
                            Tipo *
                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                            >
                                <option value="coffee">Café</option>
                                <option value="dessert">Postre</option>
                                <option value="book">Libro</option>
                                <option value="service">Servicio</option>
                            </select>
                        </label>

                        <label>
                            Categoría *
                            <input
                                name="category"
                                type="text"
                                value={form.category}
                                onChange={handleChange}
                                placeholder="Café, Postres, Libros..."
                            />
                        </label>

                        <label>
                            Precio (COP) *
                            <input
                                name="price"
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="12000"
                            />
                        </label>

                        <div>
                            <label>
                                Imagen (URL)
                                <input
                                    name="image"
                                    type="url"
                                    value={form.image}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </label>

                            <ImagePreview url={form.image} />
                        </div>

                        <label className="admin-form-full">
                            Descripción *
                            <textarea
                                name="description"
                                rows={3}
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe el producto"
                            />
                        </label>

                    </div>

                    {form.type === "book" && (
                        <div className="admin-form-extra">

                            <fieldset>
                                <legend>Formatos de lectura</legend>

                                {ALL_FORMATS.map((format) => (
                                    <label
                                        key={format}
                                        className="admin-checkbox"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.formats.includes(format)}
                                            onChange={() =>
                                                handleFormatToggle(format)
                                            }
                                        />
                                        {format}
                                    </label>
                                ))}
                            </fieldset>

                            <label className="admin-checkbox admin-checkbox-block">
                                <input
                                    type="checkbox"
                                    name="rentalEnabled"
                                    checked={form.rentalEnabled}
                                    onChange={handleChange}
                                />
                                Habilitar alquiler
                            </label>

                            {form.rentalEnabled && (
                                <div className="admin-form-grid admin-form-grid-small">
                                    <label>
                                        Precio por día
                                        <input
                                            name="rentalDailyPrice"
                                            type="number"
                                            min="0"
                                            value={form.rentalDailyPrice}
                                            onChange={handleChange}
                                            placeholder="2000"
                                        />
                                    </label>

                                    <label>
                                        Días máximos
                                        <input
                                            name="rentalMaxDays"
                                            type="number"
                                            min="1"
                                            value={form.rentalMaxDays}
                                            onChange={handleChange}
                                        />
                                    </label>
                                </div>
                            )}

                        </div>
                    )}

                    <label className="admin-checkbox admin-checkbox-block">
                        <input
                            type="checkbox"
                            name="featured"
                            checked={form.featured}
                            onChange={handleChange}
                        />
                        Destacado en el inicio
                    </label>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={saving}
                    >
                        {saving
                            ? "Guardando..."
                            : editingId
                                ? "Guardar cambios"
                                : "Crear producto"}
                    </button>

                </form>
            )}

            {loading && (
                <p className="admin-status">Cargando productos...</p>
            )}

            {error && <p className="admin-error">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <p className="admin-status">
                    No hay productos que coincidan con la búsqueda.
                </p>
            )}

            {products.length > 0 && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Tipo</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id}>
                                    <td>
                                        <strong>{product.name}</strong>
                                        <span className="admin-table-sub">
                                            {product.sku}
                                        </span>
                                    </td>

                                    <td>{product.type}</td>

                                    <td>{formatCOP(product.price)}</td>

                                    <td>
                                        <strong>{product.stock}</strong>

                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            onClick={() => {
                                                setStockTarget(product);
                                                setFeedback(null);
                                            }}
                                        >
                                            Inventario
                                        </button>
                                    </td>

                                    <td>
                                        <span
                                            className={`status-chip status-${
                                                product.active
                                                    ? "activo"
                                                    : "cancelado"
                                            }`}
                                        >
                                            {product.active
                                                ? "Activo"
                                                : "Inactivo"}
                                        </span>
                                    </td>

                                    <td className="admin-table-actions">
                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            onClick={() => openEdit(product)}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            onClick={() =>
                                                handleToggleStatus(product)
                                            }
                                        >
                                            {product.active
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {stockTarget && (
                <form className="admin-form admin-stock-form" onSubmit={handleStockSubmit}>
                    <div className="admin-form-header">
                        <h3>Inventario · {stockTarget.name}</h3>

                        <button
                            type="button"
                            className="admin-link-button"
                            onClick={() => setStockTarget(null)}
                        >
                            Cancelar
                        </button>
                    </div>

                    <div className="admin-form-grid admin-form-grid-small">
                        <label>
                            Operación
                            <select
                                value={stockForm.operation}
                                onChange={(event) =>
                                    setStockForm((previous) => ({
                                        ...previous,
                                        operation: event.target.value
                                    }))
                                }
                            >
                                <option value="restock">
                                    Reponer (sumar)
                                </option>
                                <option value="adjustment">
                                    Ajustar (valor absoluto)
                                </option>
                            </select>
                        </label>

                        <label>
                            Cantidad
                            <input
                                type="number"
                                min="1"
                                value={stockForm.quantity}
                                onChange={(event) =>
                                    setStockForm((previous) => ({
                                        ...previous,
                                        quantity: event.target.value
                                    }))
                                }
                                placeholder="10"
                            />
                        </label>

                        <label className="admin-form-full">
                            Motivo
                            <input
                                type="text"
                                maxLength={300}
                                value={stockForm.reason}
                                onChange={(event) =>
                                    setStockForm((previous) => ({
                                        ...previous,
                                        reason: event.target.value
                                    }))
                                }
                                placeholder="Ej: ingreso de mercancía"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={stockSaving}
                    >
                        {stockSaving
                            ? "Aplicando..."
                            : "Registrar movimiento"}
                    </button>

                </form>
            )}

        </div>
    );
}

export default AdminProducts;
