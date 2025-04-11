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

export const fetchIP = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/client-ip`, {
            headers: {
                'Accept': 'application/json',
            },
        });
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        return null;
    }
}

export const updateEntry = async ({id, moderate, returned = false}) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            moderate: moderate,
            ...(returned && {returned: returned})
        }),
    });
    if (!response.ok) {
        throw new Error('Failed to update entry');
    }
    return response.json();
}