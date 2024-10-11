'use client';
import { ConnectionModal } from "@/app/components/modal";
import { useSession } from "next-auth/react";
import Menu from "@/app/components/menu";



export default function App() {

    const { data: session  } = useSession();
    console.log(session);
    return (
            <div className="mx-auto font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col justify-center items-center sm:items-start ">
                    {!session?.user ? (<ConnectionModal />) : (
                        <div className="">
                            <Menu
                                user={session.user}
                            />
                        </div>
                    )}

                </main>
            </div>
    );
}
