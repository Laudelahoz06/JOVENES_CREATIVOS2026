import { useEffect, useState } from "react";

import CategoryFilter from "../components/catalog/CategoryFilter";
import ProductGrid from "../components/catalog/ProductGrid";
import { apiRequest } from "../services/api";

function Catalog() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page: String(page),
                    limit: "12",
                    sort: "newest"
                });

                if (selectedCategory) {
                    params.append("type", selectedCategory);
                }

                if (searchQuery) {
                    params.append("search", searchQuery);
                }

                const data = await apiRequest(
                    `/products?${params.toString()}`
                );

                if (!cancelled) {
                    setProducts(data.products || []);
                    setPagination(data.pagination || null);
                }

            } catch (err) {
                if (!cancelled) {
                    setProducts([]);
                    setPagination(null);
                    setError(
                        err.message ||
                            "No se pudieron cargar los productos."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        const timer = window.setTimeout(loadProducts, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [selectedCategory, searchQuery, page]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchQuery(searchInput.trim());
        setPage(1);
    };

    const clearSearch = () => {
        setSearchInput("");
        setSearchQuery("");
        setPage(1);
    };

    return (
        <section className="catalog-page">

            <div className="catalog-header">

                <span>EXPLORA MAGICAL</span>

                <h1>Nuestro catálogo</h1>

                <p>
                    Descubre sabores, historias y experiencias.
                </p>

            </div>

            <form
                className="catalog-search"
                onSubmit={handleSearchSubmit}
                role="search"
            >
                <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Buscar libros, cafés, postres..."
                    aria-label="Buscar en el catálogo"
                />

                <button type="submit" className="btn-primary">
                    Buscar
                </button>

                {searchQuery && (
                    <button
                        type="button"
                        className="admin-link-button"
                        onClick={clearSearch}
                    >
                        Limpiar
                    </button>
                )}
            </form>

            {searchQuery && (
                <p className="catalog-search-status">
                    Resultados para «{searchQuery}»
                </p>
            )}

            <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />

            <ProductGrid
                products={products}
                loading={loading}
                error={error}
            />

            {pagination && pagination.pages > 1 && (
                <nav className="catalog-pagination" aria-label="Paginación">
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={!pagination.hasPreviousPage || loading}
                        onClick={() =>
                            setPage((previous) => Math.max(1, previous - 1))
                        }
                    >
                        ← Anterior
                    </button>

                    <span>
                        Página {pagination.page} de {pagination.pages}
                    </span>

                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={!pagination.hasNextPage || loading}
                        onClick={() =>
                            setPage((previous) => previous + 1)
                        }
                    >
                        Siguiente →
                    </button>
                </nav>
            )}

        </section>
    );
}

export default Catalog;
