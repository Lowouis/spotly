'use client';
import {useSession} from "next-auth/react";

import {useRouter} from 'next/navigation'
import React, {useEffect, useState} from "react";
import {ReservationSearch} from "@/app/components/form/ReservationSearch";
import {Button} from "@nextui-org/button";

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
                    <div role="status" >
                            <Button
                                isIconOnly
                                size="lg"
                                radius="full"
                                color="none"
                                type="submit"
                                shadow="lg"
                                isLoading={true}
                                spinner={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                                        <radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125"
                                                        gradientTransform="scale(1.5)">
                                            <stop offset="0" stopColor="#000000"></stop>
                                            <stop offset=".3" stopColor="#000000" stopOpacity=".9"></stop>
                                            <stop offset=".6" stopColor="#000000" stopOpacity=".6"></stop>
                                            <stop offset=".8" stopColor="#000000" stopOpacity=".3"></stop>
                                            <stop offset="1" stopColor="#000000" stopOpacity="0"></stop>
                                        </radialGradient>
                                        <circle transformOrigin="center" fill="none" stroke="url(#a12)"
                                                strokeWidth="30" strokeLinecap="round" strokeDasharray="200 1000"
                                                strokeDashoffset="0" cx="100" cy="100" r="70">
                                            <animateTransform type="rotate" attributeName="transform" calcMode="spline"
                                                              dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1"
                                                              repeatCount="indefinite"></animateTransform>
                                        </circle>
                                        <circle transform-origin="center" fill="none" opacity=".2" stroke="#000000"
                                                strokeWidth="30" strokeLinecap="round" cx="100" cy="100"
                                                r="70"></circle>
                                    </svg>
                                }/>
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
