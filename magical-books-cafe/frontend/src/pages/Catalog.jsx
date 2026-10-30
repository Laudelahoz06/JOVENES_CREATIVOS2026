import CategoryFilter from "../components/catalog/CategoryFilter";
import ProductGrid from "../components/catalog/ProductGrid";

function Catalog() {

    return (
        <section className="catalog-page">

            <div className="catalog-header">

                <span>EXPLORA MAGICAL</span>

                <h1>Nuestro catálogo</h1>

                <p>
                    Descubre sabores, historias y experiencias.
                </p>

            </div>

            <CategoryFilter />

            <ProductGrid />

        </section>
    );
}

export default Catalog;