import * as qs from "postcss";

export function getURL(url) {
    return `${process.env.API_URL}${url}`;
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