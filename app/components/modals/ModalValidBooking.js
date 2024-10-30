'use client';
import {Button} from "@nextui-org/button";
import {
    Checkbox, Divider,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Skeleton, Spinner,
    Switch,
    Textarea, useDisclosure
} from "@nextui-org/react";
import {formatDate} from "@/app/components/modals/ModalCheckingBooking";
import {ArrowDownCircleIcon, ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {ArrowRightCircleIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import React, {useEffect, useState} from "react";
import { constructDate } from "@/app/utils/global";

export default function ModalValidBooking({data, setData, isOpen, onOpenChange, session, setPush, push}) {

    const [sumbitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        cgu: false,
    });
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    const handleSubmission = (onClose) => {
        if(formData.cgu){
            console.log(formData);
            setPush(true);
            setSubmitted(true)
        }

    }


    useEffect(() => {


        if(push && sumbitted){
            const startDate = constructDate(data.date.start);
            const endDate = constructDate(data.date.end);
            fetch('http://localhost:3000/api/entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startDate   : startDate,
                    endDate     : endDate,
                    category    : data.category,
                    site        : data.site,
                    resourceId  : data.resource.id,
                    userId      : session.user.id,
                    comment     : formData.description,
                }),
            })
                .then(response => response.json())
                .catch((error) => {
                    console.error('Error:', error);
                })
        }



    }, [data, setPush, push, session, setData, formData.description, sumbitted]);

    return (
        <>
        <Modal
            shadow="md"
            isDismissable={false}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {!sumbitted  ? (
                            <form onSubmit={(e)=> {
                            e.preventDefault();
                            handleSubmission();
                            }}>
                            <Skeleton isLoaded={data.resource}>
                                <ModalHeader className="flex flex-col gap-1">{data && data.resource ? data.resource.name : (
                                    <Spinner color="default"/>)}
                                </ModalHeader>
                            </Skeleton>
                            <Skeleton isLoaded={data.resource}>
                                <ModalBody>
                                    <div className="flex flex-col space-y-2 text-lg">
                                        <div className="flex flex-row w-full mb-2">
                                            <div className="flex justify-start items-center w-2/5">
                                                {formatDate(data.date.start)}
                                            </div>
                                            <div className="w-1/5 relative">
                                                <div
                                                    className="animate-ping absolute inset-0 inset-x-6  h-full w-8 inline-flex rounded-full bg-sky-400 opacity-75"></div>
                                                <ArrowRightCircleIcon className="absolute inset-0 m-auto" width="32"
                                                                      height="32" color="blue"/>
                                            </div>
                                            <div className="flex justify-end items-center w-2/5">
                                                {formatDate(data.date.end)}
                                            </div>
                                        </div>
                                        <Divider orientation="horizontal" className="bg-neutral-950 opacity-25"/>
                                        <div className="my-2">
                                            <Textarea
                                                name={"description"}
                                                id="description"
                                                labelPlacement="outside"
                                                placeholder="Écrire un commentaire"
                                                size='lg'
                                                onChange={handleInputChange}


                                            />
                                        </div>

                                        {/* OPTIONS BY RESOURCES */}
                                        <div className="flex flex-col justify-between my-6">
                                            {data?.resource?.moderate && (
                                                <div className="flex flex-row items-center space-x-4 my-2">
                                                    <Button size="sm" radius="full" color="danger" isIconOnly
                                                            variant="solid" disabled={true}>
                                                        <ShieldExclamationIcon className="w-6 h-6" color="white"/>
                                                    </Button>
                                                    <span className="text-sm">Votre réservation doit-être confirmé par un administrateur</span>
                                                </div>
                                            )}
                                            {/* OPTIONS BY RESOURCES ==> ADD MORE OPTIONS HERE LATER */}

                                        </div>

                                        <Divider orientation="horizontal" className="bg-neutral-950 opacity-25"/>
                                        <div>
                                        <span className="flex flex-col space-y-2 text-slate-700 mt-2">
                                            <span className="font-bold text-lg">Conditions d'utilisation</span>
                                            <span className="text-slate-500 text-sm">
                                                La ressource doit être restituée dans le délai indiqué. Pour confirmer le retour, un code à 6 chiffres vous sera envoyé par mail pour confirmer le retour de la ressource.
                                            </span>
                                            <Checkbox id="cgu"
                                                      name="cgu"
                                                      required
                                                      onChange={(e)=>handleInputChange(e)}
                                                      radius="md"
                                                      value={formData.cgu}
                                            >
                                                J'accepte les conditions
                                            </Checkbox>

                                        </span>
                                        </div>

                                    </div>
                                </ModalBody>
                                </Skeleton>
                                    <ModalFooter>
                                        <Skeleton isLoaded={data.resource}>
                                            <div className="flex flex-row space-x-2">
                                                <Button color="danger" variant="flat" size="lg" onPress={onClose}>
                                                    Annuler
                                                </Button>
                                                <Button color="primary" type="submit" size="lg" >
                                                    {!data.resource.moderate ? "Réserver" : "Demander"}
                                                </Button>
                                            </div>

                                        </Skeleton>

                                    </ModalFooter>
                                </form>
                        ) : (
                            <ModalBody>
                                <div className="flex flex-col gap-2 items-center justify-center p-2">
                                    <ModalHeader>
                                        <h1 className="text-neutral-800">Votre réservation a été confirmée. </h1>
                                    </ModalHeader>
                                    <div className="w-full relative mb-4">
                                        <div
                                            className="animate-ping absolute inset-0 inset-x-6  h-full w-8 inline-flex rounded-full bg-sky-400 opacity-75"></div>
                                        <ArrowDownCircleIcon className="absolute inset-0 m-auto" width="32"
                                                              height="32" color="green"/>
                                    </div>

                                    <h1 className="text-neutral-800">Mail de confirmation envoyer à : </h1>
                                    <h2 className="font-thin text-neutral-700">admin@admin.fr</h2>
                                    <Button color="primary" onPress={() => {
                                        setSubmitted(false);
                                        onClose();

                                    }}>
                                        D'accord
                                    </Button>
                                </div>
                            </ModalBody>

                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
        </>
    )
}