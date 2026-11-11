import { apiRequest } from "./api";

function buildQuery(params = {}) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;

        query.set(key, value);
    }

    const queryString = query.toString();

    return queryString ? `?${queryString}` : "";
}

export async function getProducts(params = {}) {
    const data = await apiRequest(`/products${buildQuery(params)}`);

    return {
        products: data.products || [],
        pagination: data.pagination || null
    };
}

export async function getProduct(id) {
    const data = await apiRequest(`/products/${id}`);

    return data.product;
}

export async function getFeaturedProducts(limit = 3) {
    const { products } = await getProducts({
        featured: true,
        limit,
        sort: "newest"
    });

    return products;
}
