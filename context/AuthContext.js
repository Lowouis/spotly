import {createContext, useContext, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {addToast} from '@heroui/toast';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const {status, data: session} = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            addToast({
                title: 'Session expirée',
                message: 'Veuillez vous reconnecter',
                type: 'warning',
                duration: 5000,
            });
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