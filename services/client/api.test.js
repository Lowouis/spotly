import {checkIPAuthorization, fetchAPI, fetchIP, getAllUsers, getURL, updateEntry} from './api';
import {addToast} from '@/lib/toast';

jest.mock('@/lib/toast', () => ({
    addToast: jest.fn(),
}));

describe('client api service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_API_ENDPOINT = '';
        global.fetch = jest.fn();
    });

    it('builds application URLs from the configured endpoint', () => {
        expect(getURL('/api/users')).toBe('/api/users');
    });

    it('fetchAPI serializes query params and returns json', async () => {
        global.fetch.mockResolvedValueOnce({json: async () => ({ok: true})});

        await expect(fetchAPI('/resources', {categoryId: 1, empty: ''})).resolves.toEqual({ok: true});

        expect(global.fetch).toHaveBeenCalledWith('/api/resources?categoryId=1', {
            headers: {'Content-Type': 'application/json'},
        });
    });

    it('fetchIP returns the client ip from the public endpoint', async () => {
        global.fetch.mockResolvedValueOnce({json: async () => ({ip: '127.0.0.1'})});

        await expect(fetchIP()).resolves.toBe('127.0.0.1');
    });

    it('updateEntry sends the expected payload', async () => {
        global.fetch.mockResolvedValueOnce({ok: true, json: async () => ({id: 1})});

        await expect(updateEntry({id: 1, moderate: 'USED', returned: true})).resolves.toEqual({id: 1});

        expect(global.fetch).toHaveBeenCalledWith('/api/entry/1', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({moderate: 'USED', returned: true}),
        }));
    });

    it('getAllUsers throws on failed responses', async () => {
        global.fetch.mockResolvedValueOnce({ok: false});

        await expect(getAllUsers()).rejects.toThrow('Failed to fetch users');
    });

    it('checkIPAuthorization returns false and notifies on unauthorized response', async () => {
        global.fetch.mockResolvedValueOnce({status: 401, ok: false});

        await expect(checkIPAuthorization('127.0.0.1')).resolves.toBe(false);
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({color: 'danger'}));
    });
});
