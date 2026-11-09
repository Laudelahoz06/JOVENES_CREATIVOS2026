function ProductCard({ product, onViewDetails }) {
    const image = product.imageUrl || "/ProductoNoDisponible.png";

    return (
        
        <article className="catalog-product-card">

            <img 
                src={image} 
                alt={product.name}
                onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/ProductoNoDisponible.png";
                }}
            />

            <div className="catalog-product-info">

                <span>{product.category}</span>

                <h3>{product.name}</h3>

                <p>
                    {Number(product.price).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0
                    })}                
                </p>

                <button 
                    type="button"
                    onClick={() => onViewDetails(product)}
                >
                    Ver producto
                </button>

            </div>

        </article>
    );
}

export default ProductCard;