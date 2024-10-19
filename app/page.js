'use client';
import { useSession } from "next-auth/react";
import Menu, {AlternativeMenu} from "@/app/components/menu";
import MakeReservation  from "@/app/reservation";
import { useRouter } from 'next/navigation'
import {useEffect, useState} from "react";
import {CircularProgress} from "@nextui-org/progress";

export default function App() {
    const router = useRouter()
    const { data: session, status  } = useSession();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (status !== 'authenticated' && status !== 'loading') {
            router.push('/login');
        } else if(status === 'authenticated') {
            setLoading(false);
        }
    }, [router, status]);


        return loading ? (
            <div className="fixed left-0 top-0 z-50 block h-full w-full bg-white opacity-75">
                <span className="r-4 relative top-1/2 mx-auto my-0 block h-0 w-0 text-green-500 opacity-75">
                    <div role="status">
                        <CircularProgress size="lg" aria-label="Chargement..."/>
                    </div>
                </span>
            </div>
        ) : (
            <div className="mx-auto font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col justify-center items-center sm:items-start m-3">
                    <div className="flex flex-col m-1 w-full justify-center items-center mx-auto">
                        <AlternativeMenu user={session?.user}/>
                        <MakeReservation session={session}/>
                    </div>
                </main>
            </div>
        );


}
