jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/pages/api/auth/[...nextauth]', () => ({
    authConfig: {},
}));

import {getServerSession} from 'next-auth/next';
import {isAllowedOrigin} from './core';
import {rateLimit, requireAdmin, requireAuth, resetRateLimitStore} from './api-auth';

function createResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
    };
}

describe('API security helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetRateLimitStore();
    });

    it('rejects unauthenticated requests', async () => {
        getServerSession.mockResolvedValue(null);
        const res = createResponse();

        await expect(requireAuth({}, res)).resolves.toBe(null);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects non-admin users for admin endpoints', async () => {
        getServerSession.mockResolvedValue({user: {id: 1, role: 'USER'}});
        const res = createResponse();

        await expect(requireAdmin({}, res)).resolves.toBe(null);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows admin users for admin endpoints', async () => {
        const session = {user: {id: 1, role: 'ADMIN'}};
        getServerSession.mockResolvedValue(session);
        const res = createResponse();

        await expect(requireAdmin({}, res)).resolves.toBe(session);
    });

    it('rate limits repeated requests', () => {
        const req = {headers: {}, socket: {remoteAddress: '127.0.0.1'}};
        const res = createResponse();

        expect(rateLimit(req, res, {key: 'test', limit: 1, windowMs: 60_000})).toBe(true);
        expect(rateLimit(req, res, {key: 'test', limit: 1, windowMs: 60_000})).toBe(false);
        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('does not allow arbitrary CORS origins', () => {
        expect(isAllowedOrigin('https://evil.example')).toBe(false);
    });
});
