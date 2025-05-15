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


// fait une request get sur /api/users pour récupérer tous les utilisateurs
export const getAllUsers = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/users`);
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    return response.json();
}

export const checkIPAuthorization = async (ip) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/authorized-location/check/${ip}`);
        if (response.status === 401) {
            addToast({
                title: "Accès refusé",
                description: "Cet appareil n'est pas autorisé à effectuer cette action.",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
            return false;
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return true;
    } catch (error) {
        addToast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la vérification de l'appareil.",
            timeout: 5000,
            variant: "solid",
            radius: "sm",
            color: "danger"
        });
        return false;
    }
};