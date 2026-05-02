import {Card, CardContent, CardHeader} from "@/components/ui/card";


export default function Block({isLoaded,quantity, label, logo}){


    return (
        <div className="w-full h-full flex flex-col">
            <Card
                aria-busy={!isLoaded}
                className="flex-1 flex flex-col border-neutral-200 dark:border-neutral-700 rounded-xl
                             shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200 
                             bg-white dark:bg-neutral-900 py-6"
            >
                <CardHeader className="pb-2 pt-2 px-6 flex-col items-center justify-center gap-2">
                    <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{quantity}</p>
                    <p className="text-xs tracking-wider uppercase text-neutral-600 dark:text-neutral-400">{label}</p>
                </CardHeader>
                <CardContent className="overflow-visible flex justify-center items-center py-4">
                    <div className="text-neutral-500 dark:text-neutral-400">
                        {logo}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
