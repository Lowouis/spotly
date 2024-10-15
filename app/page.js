'use client';
import { useSession } from "next-auth/react";
import Menu from "@/app/components/menu";
import MakeReservation  from "@/app/reservation";
import { useRouter } from 'next/navigation'
import {useEffect, useState} from "react";

export default function App() {
    const router = useRouter()
    const { data: session, status  } = useSession();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (status === 'loading') {
            return;
        }
        if (status !== 'authenticated') {
            router.push('/login');
        } else {
            setLoading(false);
        }
    }, [router, status]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
            <div className="mx-auto font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col justify-center items-center sm:items-start ">
                    <div className="flex flex-row">
                        <Menu
                            user={session?.user}
                        />
                        <MakeReservation />
                    </div>
                </main>
            </div>
    );
}
