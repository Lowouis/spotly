import * as qs from "postcss";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

export function getURL(url) {
    return `${API_ENDPOINT}${url}`;
}
export async function fetchAPI(path, urlParamsObject = {}, options = {}) {

    const mergedOptions = {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    };
    const queryString = qs.stringify(urlParamsObject);
    const requestUrl = `${getURL(
        `/api${path}${queryString ? `?${queryString}` : ""}`
    )}`;
    try {
        const response = await fetch(requestUrl, mergedOptions);
        return await response.json();
    } catch (error) {
        console.error(error);
        throw new Error(`An error occurred please try again`);
    }
}