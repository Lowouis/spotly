import {render, screen} from '@testing-library/react';
import {AuthProvider, useAuth} from './AuthContext';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

function Consumer() {
    const auth = useAuth();
    return <div>{auth.status}:{auth.user?.username}</div>;
}

describe('AuthContext', () => {
    const push = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({push});
        window.history.pushState({}, '', '/?next=/admin');
    });

    it('exposes authenticated user state', () => {
        useSession.mockReturnValue({status: 'authenticated', data: {user: {username: 'alice'}}});

        render(<AuthProvider><Consumer /></AuthProvider>);

        expect(screen.getByText('authenticated:alice')).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });

    it('redirects unauthenticated users to login preserving search params', () => {
        useSession.mockReturnValue({status: 'unauthenticated', data: null});

        render(<AuthProvider><Consumer /></AuthProvider>);

        expect(push).toHaveBeenCalledWith('/login?next=/admin');
    });
});
