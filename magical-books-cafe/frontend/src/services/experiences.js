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

export async function getExperiences(params = {}) {
    const data = await apiRequest(
        `/experiences${buildQuery({ sort: "order", ...params })}`
    );

    return {
        experiences: data.experiences || [],
        pagination: data.pagination || null
    };
}
