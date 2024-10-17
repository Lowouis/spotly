

export default function SideCard({available=false}) {

    return available ? (
        <div className="mx-2 p-1">

            <span className="flex justify-center">
                Ce crénaux est disponible
            </span>
        </div>
    ) : (
        <div className="flex flex-col mx-2 w-full bg-slate-100 p-2 rounded-md">
            <span className="flex justify-start mb-2">
                Réverver par : <span className="font-semibold">&nbsp;GURITA Louis</span>
            </span>
            <span className="flex justify-start mb-2">
                Ressource : <span className="font-semibold">&nbsp; LAPTOP10</span>
            </span>
            <span className="flex justify-start">
                Le : <span className="font-semibold">&nbsp; 17 décembre 2024 &nbsp;</span>
            </span>
            <span className="flex justify-start">
                De : <span className="font-semibold">&nbsp; 9h00 &nbsp;</span> à <span className="font-semibold">&nbsp; 10h00</span>
            </span>

        </div>
    );
}