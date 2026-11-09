import ProductCard from "./ProductCard";

function ProductGrid({ products, loading, error, onViewDetails }) {
    if (loading) {
        return (
            <div className="catalog-grid">
                <p className="catalog-loading">
                    Cargando productos...
                </p>
            </div>
        );
    }


    if (error) {
        return (
            <div className="catalog-grid">
                <p className="catalog-error">{error}</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="catalog-grid">
                <p>No hay productos disponibles por el momento.</p>
            </div>
        );
    }


    return (
        <div className="catalog-grid">
            {products.map((product) => (
                <ProductCard 
                    key={product._id} 
                    product={product}
                    onViewDetails={onViewDetails}
                />
            ))}
        </div>
    );
}

export default ProductGrid;
