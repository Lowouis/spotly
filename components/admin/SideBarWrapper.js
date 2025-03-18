import Sidebar from "@/components/admin/Sidebar";


export default function SideBarWrapper({children}){
    return (
        <div className="flex flex-row">
            <Sidebar />
            {children}
        </div>
    )
}