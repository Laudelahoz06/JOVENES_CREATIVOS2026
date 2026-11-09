const categories = [
{ label: "Todos", value: "" },
    { label: "Café", value: "coffee" },
    { label: "Postres", value: "dessert" },
    { label: "Libros", value: "book" },
    { label: "Servicios", value: "service" }
];

function CategoryFilter({ selectedCategory, onCategoryChange }) {

    return (
        <div className="category-filter">

            {categories.map((category) => (

                <button 
                    key={category.value || "all"}
                    type="button"
                    className={
                        selectedCategory === category.value
                            ? "active"
                            : ""
                    }
                    onClick={() => onCategoryChange(category.value)}    
                >
                    {category.label}
                   
                </button>

            ))}

        </div>
    );
}

export default CategoryFilter;