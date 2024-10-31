import Sidebar from "@/app/components/admin/Sidebar";
import Site from "@/app/components/admin/site";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import SideBarWrapper from "@/app/components/admin/SideBarWrapper";


export default function Admin(){

    return (
        <div className={`${GeistSans.variable} ${GeistMono.variable} antialiased h-full w-full`}>
            <SideBarWrapper>
                <div className="flex justify-start items-center w-full flex-col">
                    dashboard a faire
                </div>
            </SideBarWrapper>
        </div>

    )
}