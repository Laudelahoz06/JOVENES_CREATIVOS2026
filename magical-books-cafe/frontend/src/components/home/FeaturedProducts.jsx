import { useEffect, useState } from "react";

import { getFeaturedProducts } from "../../services/products";

function FeaturedProducts() {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let cancelled = false;

        getFeaturedProducts(3)
            .then((items) => {
                if (!cancelled) setProducts(items);
            })
            .catch(() => {
                if (!cancelled) setProducts([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };

    }, []);

    return (
        <section className="featured-products">

            <div className="section-heading">
                <span>SELECCIÓN ESPECIAL</span>
                <h2>Favoritos del universo Magical</h2>
            </div>

            {loading && (
                <p className="catalog-status">
                    Cargando destacados...
                </p>
            )}

            {!loading && products.length === 0 && (
                <p className="catalog-status">
                    Pronto mostraremos nuestros favoritos.
                </p>
            )}

            {!loading && products.length > 0 && (

                <div className="product-grid">

                    {products.map((product) => (

                        <article className="product-card" key={product._id}>

                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                />
                            ) : (
                                <div className="catalog-product-placeholder">
                                    Sin imagen
                                </div>
                            )}

                            <div className="product-info">

                                <span>{product.category}</span>

                                <h3>{product.name}</h3>

                                <p>
                                    ${Number(product.price ?? 0).toLocaleString("es-CO")}
                                </p>

                            </div>

                        </article>

                    ))}

                </div>

            )}

        </section>
    );
}

export default FeaturedProducts;
