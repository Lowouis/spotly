'use client';
import {useSession} from "next-auth/react";

import {useRouter} from 'next/navigation'
import {useEffect, useState} from "react";
import {CircularProgress} from "@nextui-org/progress";
import {ReservationSearch} from "@/app/components/form/ReservationSearch";

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
            <div className="fixed left-0 top-0 z-50 block h-full w-full bg-white ">
                <span className="r-4 relative top-1/2 mx-auto my-0 block h-0 w-0">
                    <div role="status">
                            <CircularProgress color='primary' size="lg" label="Chargement..."  aria-label="Chargement..." />
                    </div>
                </span>
            </div>
        ) : (
            <div className="mx-auto font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col justify-center items-center sm:items-start">
                    <div className="flex flex-col w-full justify-center items-center mx-auto">
                        <div className="flex flex-col w-full">
                                    {/*<AlternativeMenu user={session?.user}/>*/}
                                    <ReservationSearch session={session}/>
                        </div>
                    </div>
                </main>
            </div>
);


}
