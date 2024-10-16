import { ConnectionModal } from "@/app/components/modal";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function Login() {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    return (status !== 'authenticated' || status !== 'loading') ?? (
        <div className="flex justify-center">
            <ConnectionModal />
        </div>
    );
}