import Image from "next/image";
import { PrismaClient } from "@prisma/client";
import Input from "@/app/components/input";
import Modal from "@/app/components/modal";
import Banner from "@/app/components/banner";
import { ConnectionModal } from "@/app/components/modal";
import prisma  from "@/prismaconf/init";
import { signIn } from "next-auth/react";
export default async function Home() {

    const users = await prisma.user.findMany();
    const session = signIn();
    console.log(session);
    return (
        <div className="mx-auto sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col justify-center items-center sm:items-start ">
                {!session?.user ? (<ConnectionModal />) : (
                    <div>
                        Bienvenue sur le site de test
                    </div>
                )
                }
            </main>
        </div>
    );
}
