import {createContext, useContext, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const {status, data: session} = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            const params = window.location.search;
            router.push("/login" + params);
        }
    }, [status, router]);

    const value = {
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading",
        user: session?.user,
        status
    };

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