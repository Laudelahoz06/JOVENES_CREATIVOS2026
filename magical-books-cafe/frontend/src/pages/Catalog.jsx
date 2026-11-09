import { useEffect, useState } from "react";

import CategoryFilter from "../components/catalog/CategoryFilter";
import ProductGrid from "../components/catalog/ProductGrid";
import { apiRequest } from "../services/api";


function Catalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page: "1",
                    limit: "12",
                    sort: "newest"
                });

                if (selectedCategory) {
                    params.append("type", selectedCategory);
                }

                const data = await apiRequest(
                    `/products?${params.toString()}`
                );

                if (!cancelled) {
                    setProducts(data.products || []);
                }

            } catch (err) {
                if (!cancelled) {
                    setProducts([]);
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

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, [selectedCategory]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setSelectedProduct(null);
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

            <CategoryFilter 
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />

            <ProductGrid 
                products={products}
                loading={loading}
                error={error}
                onViewDetails={setSelectedProduct}
            />

            {selectedProduct && (
                <section className="product-detail">
                    <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                    >
                        Cerrar detalles
                    </button>

                    <h2>{selectedProduct.name}</h2>

                    <p>{selectedProduct.description}</p>

                    <p>
                        Precio:{" "}
                        {Number(selectedProduct.price).toLocaleString(
                            "es-CO",
                            {
                                style: "currency",
                                currency: "COP",
                                maximumFractionDigits: 0
                            }
                        )}
                    </p>

                    {selectedProduct.type === "book" && (
                        <>
                            <p>
                                Formatos:{" "}
                                {selectedProduct.formats?.join(", ") ||
                                    "No especificados"}
                            </p>

                            {selectedProduct.rental?.enabled && (
                                <p>
                                    Alquiler por día:{" "}
                                    {Number(
                                        selectedProduct.rental.dailyPrice
                                    ).toLocaleString("es-CO", {
                                        style: "currency",
                                        currency: "COP",
                                        maximumFractionDigits: 0
                                    })}
                                </p>
                            )}
                        </>
                    )}
                </section>
            )}

        </section>
    );
}

export default Catalog;