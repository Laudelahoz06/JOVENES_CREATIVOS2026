const categories = [
    "Todos",
    "Café",
    "Postres",
    "Libros",
    "Servicios"
];

function CategoryFilter() {

    return (
        <div className="category-filter">

            {categories.map((category) => (

                <button key={category}>
                    {category}
                </button>

            ))}

        </div>
    );
}

export default CategoryFilter;