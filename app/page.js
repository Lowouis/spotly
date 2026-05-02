'use client';
import {useSession} from "next-auth/react";
import {useRouter} from 'next/navigation'
import React, {useEffect} from "react";
import {ReservationSearch} from "@/components/form/ReservationSearch";
import {Spinner} from "@/components/ui/spinner";


export default function App() {
    const router = useRouter()
    const { status  } = useSession();
    useEffect(() => {
        if (status !== 'authenticated' && status !== 'loading') {
            const params = window.location.search;
            router.push('/login' + params);
        }
    }, [router, status]);

        return status !== 'authenticated' ? (
            <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-background">
                <Spinner className="h-8 w-8 text-foreground" label="Chargement..." />
            </div>
        ) : (
            <div className="mx-auto font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col justify-center items-center sm:items-start">
                    <div className="flex flex-col w-full justify-center items-center mx-auto">
                        <div className="flex flex-col w-full">
                            <ReservationSearch />
                        </div>
                    </div>
                </div>
            </div>
        );


}
