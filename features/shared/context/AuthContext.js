import {createContext, useContext, useEffect, useMemo} from 'react';
import {useSession} from 'next-auth/react';
import {usePathname, useRouter} from 'next/navigation';

const PUBLIC_ROUTES = ['/login', '/register', '/setup', '/forgot-password', '/reset-password'];

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const {status, data: session} = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname?.startsWith(`${route}/`));
        if (status === "unauthenticated" && !isPublicRoute) {
            const params = window.location.search;
            router.push("/login" + params);
        }
    }, [pathname, status, router]);

    const value = useMemo(() => ({
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading",
        user: session?.user,
        status
    }), [session?.user, status]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 
