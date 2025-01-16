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
    Textarea
} from "@nextui-org/react";
import {formatDate} from "@/app/components/modals/ModalCheckingBooking";
import {ArrowRightCircleIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import React, { useState} from "react";
import { constructDate } from "@/app/utils/global";
import {useMutation} from "@tanstack/react-query";
export default function ModalValidBooking({data, isOpen, onOpenChange, session, setPush, handleRefresh, setToast, handleResetFetchedResources}) {

    const [sumbitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        comment: "",
        cgu: false,
    });




    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    const mutation = useMutation({
        mutationFn: async (newEntry) => {
            const response = await fetch('http://localhost:3000/api/entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEntry),
            });
            if (!response.ok) {
                throw new Error('Failed to create entry');
            }
            return response.json();
        },
        onSuccess: () => {
            handleRefresh();
            handleResetFetchedResources();
            setToast({title: "Nouvelle réservation", description: `La réservation est bien enregistrer, un mail de confirmation à été envoyé à ${session.user.email}`, type: "success"});
        },
        onError: (error) => {
            console.error(error);
            setToast({title: "Erreur", description: "La réservation n'a pas pu être effectuée", type: "danger"});
        },
    });

    const handleSubmission = (onClose) => {
        if (formData.cgu) {
            const startDate = constructDate(data.date.start);
            const endDate = constructDate(data.date.end);
            mutation.mutate({
                startDate: startDate,
                endDate: endDate,
                category: data.category,
                site: data.site,
                resourceId: data.resource.id,
                userId: session.user.id,
                comment: formData.comment,
                moderate: data.resource.moderate ? "WAITING" : whoIsPickable(data) ? "USED" : "ACCEPTED",
            });
            setSubmitted(true);
            setPush(true);
            onClose();
        }
    };

    const whoIsPickable = (entry) => {
        if(entry.resource.pickable !== null){
            return entry.resource.pickable === "TRUST";
        } else if(entry.resource.category.pickable !== null){
            return entry.resource.category.pickable === "TRUST";
        } else if(entry.resource.domains.pickable !== null){
            return entry.resource.domains.pickable === "TRUST";
        } else {
            return "TRUST";
        }
    }

    return (
        <>
        <Modal
            shadow="lg"
            isDismissable={false}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {!sumbitted  && (
                            <form onSubmit={(e)=> {
                            e.preventDefault();
                            handleSubmission(onClose);
                            }}>
                            <Skeleton isLoaded={data.resource}>
                                <ModalHeader className="flex flex-col gap-1">{data && data.resource ? data.resource.name : (
                                    <Spinner color="default"/>)}
                                </ModalHeader>
                            </Skeleton>
                            <Skeleton isLoaded={data.resource}>
                                <ModalBody>
                                    <div className="flex flex-col space-y-2 text-lg">
                                        <div className="flex flex-row w-full mb-2 text-sm uppercase font-semibold">
                                            <div className="flex justify-start items-center w-2/5 ">
                                                {formatDate(data.date.start)}
                                            </div>
                                            <div className="w-1/5 relative">
                                                <div
                                                    className="animate-ping absolute inset-1 inset-x-7 -inset-y-0.5  h-6 w-6 inline-flex rounded-full bg-sky-400 opacity-75"></div>
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
                                                name="comment"
                                                id="comment"
                                                labelPlacement="outside"
                                                placeholder="Écrire un commentaire"
                                                size='lg'
                                                variant="bordered"
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

                                        <Divider orientation="horizontal" className="bg-neutral-800 opacity-25"/>
                                        <div>
                                        <span className="flex flex-col space-y-2 text-slate-700 mt-2">
                                            <span className="font-bold text-lg">Conditions d&apos;utilisation</span>
                                            <span className="text-slate-500 text-sm">
                                                La ressource doit être restituée dans le délai indiqué. Pour confirmer
                                                l'utilisation de la ressource et son retour, vous devrez saisir un code
                                                à 6 chiffres qui vous sera envoyé par mail pour confirmer le pickup et le retour de la ressource.
                                            </span>
                                            <Checkbox id="cgu"
                                                      name="cgu"
                                                      required
                                                      onChange={(e)=>handleInputChange(e)}
                                                      radius="md"
                                                      value={formData.cgu}
                                            >
                                                J&apos;accepte les conditions
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
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
        </>
    )
}