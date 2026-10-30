const products = [
    {
        name: "Café Moka",
        category: "Café premium",
        price: 12000,
        image: "/images/cafe-moka.jpg"
    },
    {
        name: "Cheesecake artesanal",
        category: "Postres",
        price: 15000,
        image: "/images/cheesecake.jpg"
    },
    {
        name: "El Principito",
        category: "Literatura",
        price: 35000,
        image: "/images/principito.jpg"
    }
];

function FeaturedProducts() {

    return (
        <section className="featured-products">

            <div className="section-heading">
                <span>SELECCIÓN ESPECIAL</span>
                <h2>Favoritos del universo Magical</h2>
            </div>

            <div className="product-grid">

                {products.map((product) => (

                    <article className="product-card" key={product.name}>

                        <img
                            src={product.image}
                            alt={product.name}
                        />

                        <div className="product-info">

                            <span>{product.category}</span>

                            <h3>{product.name}</h3>

                            <p>
                                ${product.price.toLocaleString("es-CO")}
                            </p>

                        </div>

                    </article>

                ))}

            </div>

        </section>
    );
}

export default FeaturedProducts;