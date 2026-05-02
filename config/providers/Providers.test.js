import {render, screen} from '@testing-library/react';
import Providers from './Providers';

jest.mock('next-auth/react', () => ({
    SessionProvider: ({children}) => <div data-testid="session-provider">{children}</div>,
}));

jest.mock('@/components/ui/sonner', () => ({
    Toaster: () => <div data-testid="sonner-toaster" />,
}));

jest.mock('@/features/shared/context/EmailContext', () => ({
    EmailProvider: ({children}) => <>{children}</>,
}));

jest.mock('@/features/shared/context/AdminDataManager', () => ({
    AdminDataManager: ({children}) => <>{children}</>,
}));

jest.mock('@/features/shared/context/RefreshContext', () => ({
    RefreshProvider: ({children}) => <>{children}</>,
}));

jest.mock('@/features/shared/context/ThemeContext', () => ({
    ThemeProvider: ({children}) => <>{children}</>,
}));

jest.mock('@/features/shared/context/AuthContext', () => ({
    AuthProvider: ({children}) => <>{children}</>,
}));

describe('Providers', () => {
    it('renders application children inside provider stack', () => {
        render(<Providers><div>Application</div></Providers>);

        expect(screen.getByText('Application')).toBeInTheDocument();
        expect(screen.getByTestId('session-provider')).toBeInTheDocument();
        expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });
});
