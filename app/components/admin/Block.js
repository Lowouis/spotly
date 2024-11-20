import {Card, CardBody, CardHeader, Skeleton} from "@nextui-org/react";


export default function Block({isLoaded,quantity, label, logo}){


    return (
        <div className="w-full">
            <Skeleton isLoaded={isLoaded} className="rounded-lg">
                <Card className="border-2 border-transparent rounded-xl hover:cursor-pointer hover:border-2 hover:border-neutral-300 py-4">
                        <CardHeader className="pb-0 pt-2 px-4 flex-col items-center justify-center space-x-1">
                            <p className="text-xl text-default-800">{quantity}</p>
                            <p className="text-sm uppercase font-bold">{label}</p>
                        </CardHeader>
                        <CardBody className="overflow-visible flex justify-center items-center py-2">
                            {logo}
                        </CardBody>
                </Card>
            </Skeleton>

        </div>
    )
}