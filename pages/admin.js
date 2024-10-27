import Sidebar from "@/app/components/admin/Sidebar";
import Site from "@/app/components/admin/site";



export default function Admin(){

    return (
        <div className="h-full w-full flex flex-row">
            <Sidebar />
            <div className="flex justify-start items-center w-full flex-col">
                <Site />
            </div>
        </div>

    )
}