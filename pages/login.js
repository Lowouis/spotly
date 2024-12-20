import {ConnectionModal} from "@/app/components/connectionModal";
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {useEffect} from 'react';

export default function Login() {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    return (
        <div className="flex justify-center">
            <ConnectionModal />
        </div>
    );
}

