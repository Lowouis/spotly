export class ApiError extends Error {
    constructor(message, statusCode = 500, details = undefined) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export function sendApiError(res, error, fallbackMessage = 'Internal server error') {
    const statusCode = error?.statusCode || 500;
    const message = error?.message || fallbackMessage;

    return res.status(statusCode).json({
        error: message,
        ...(error?.details && {details: error.details}),
    });
}
