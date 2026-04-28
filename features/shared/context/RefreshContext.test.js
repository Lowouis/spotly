import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {act, renderHook, waitFor} from '@testing-library/react';
import {RefreshProvider, useRefreshContext} from './RefreshContext';

function createWrapper(queryClient) {
    return function Wrapper({children}) {
        return (
            <QueryClientProvider client={queryClient}>
                <RefreshProvider>{children}</RefreshProvider>
            </QueryClientProvider>
        );
    };
}

describe('RefreshContext', () => {
    it('refetches queries and tracks refresh state', async () => {
        const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
        let resolveRefetch;
        const refetchPromise = new Promise((resolve) => {
            resolveRefetch = resolve;
        });
        const refetchSpy = jest.spyOn(queryClient, 'refetchQueries').mockReturnValue(refetchPromise);

        const {result} = renderHook(() => useRefreshContext(), {
            wrapper: createWrapper(queryClient),
        });

        let promise;
        act(() => {
            promise = result.current.refreshData({queryKey: ['resources']});
        });

        expect(result.current.isRefreshing).toBe(true);

        await act(async () => {
            resolveRefetch();
            await promise;
        });

        await waitFor(() => expect(result.current.isRefreshing).toBe(false));
        expect(refetchSpy).toHaveBeenCalledWith({queryKey: ['resources']});
    });
});
