import Sidebar from "@/app/components/admin/Sidebar";
import Site from "@/app/components/admin/site";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';


export default function Admin(){

    return (
        <div className={`${GeistSans.variable} ${GeistMono.variable} antialiased h-full w-full flex flex-row `}>
            <Sidebar />
            <div className="flex justify-start items-center w-full flex-col">
                <Site />
            </div>
        </div>

    )
}