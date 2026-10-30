function ProductCard({ product }) {

    return (
        <article className="catalog-product-card">

            <img src={product.image} alt={product.name} />

            <div className="catalog-product-info">

                <span>{product.category}</span>

                <h3>{product.name}</h3>

                <p>
                    ${product.price.toLocaleString("es-CO")}
                </p>

                <button>
                    Ver producto
                </button>

            </div>

        </article>
    );
}

export default ProductCard;