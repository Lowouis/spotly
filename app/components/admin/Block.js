import {Card, CardBody, CardHeader, Skeleton} from "@nextui-org/react";


export default function Block({isLoaded,quantity, label, logo}){


    return (
        <div className="w-full h-full flex flex-col">
            <Card className="flex-1 flex flex-col border-2 border-transparent rounded-xl hover:cursor-pointer hover:border-2 hover:border-neutral-300 py-4">
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-center justify-center space-x-1" >
                    <Skeleton isLoaded={isLoaded} className="rounded-lg w-[100px] text-center mb-2">
                        <p className="text-xl text-default-800">{quantity}</p>
                    </Skeleton>
                    <Skeleton isLoaded={isLoaded} className="rounded-lg w-[100px]">
                        <p className="text-sm uppercase font-bold text-center">{label}</p>
                    </Skeleton>
                </CardHeader>
                <CardBody className="overflow-visible flex justify-center items-center py-2">
                    {logo}
                </CardBody>
            </Card>
        </div>
    )
}