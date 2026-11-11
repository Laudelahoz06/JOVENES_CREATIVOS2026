import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "../common/Skeleton";

function ProductGrid({ products, loading, error }) {
    if (loading) {
        return (
            <div className="catalog-grid">
                {Array.from({ length: 6 }, (_, index) => (
                    <ProductCardSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="catalog-grid">
                <p className="catalog-status catalog-status-error">{error}</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="catalog-grid">
                <p className="catalog-status">
                    No encontramos productos con esos criterios.
                </p>
            </div>
        );
    }

    return (
        <div className="catalog-grid">
            {products.map((product) => (
                <ProductCard
                    key={product._id}
                    product={product}
                />
            ))}
        </div>
    );
}

export default ProductGrid;
