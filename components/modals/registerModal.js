'use client';

import Banner from "@/components/utils/banner";
import React, {useEffect, useState} from "react";
import {signIn} from "next-auth/react";
import {useRouter} from 'next/navigation'
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import {
    Alert,
    Card,
    CardBody,
    InputOtp, Link,
    Modal, ModalBody,
    ModalContent, ModalFooter,
    ModalHeader,
    Tab,
    Tabs, Tooltip,
    useDisclosure
} from "@nextui-org/react";
import {ArrowRightCircleIcon} from "@heroicons/react/24/solid";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ClockIcon} from "@heroicons/react/24/outline";
import {lastestPickable} from "@/global";
import {addToast} from "@heroui/toast";

export async function updateEntry({setUserAlert, id, moderate, returned = false}) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            moderate: moderate,
            ...(returned && {returned: returned})
        }),
    });
    if (!response.ok) {
        setUserAlert({"type": "danger", "message": "Erreur lors de la mise à jour de la réservation."});
        throw new Error('Failed to update entry');
    }
    return response.json();
}

export function RegisterModal({}) {
    const [selected, setSelected] = useState("login");
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [creditentials, setCreditentials] = useState([
        {
            "label": "Nom d'utilisateur",
            "name": "login",
            "value": "",
            "type": "text"
        },
        {
            "label": "Mot de passe",
            "name": "password",
            "value": "",
            "type": "password"
        },
        {
            "label": "Confirmer le mot de passe",
            "name": "confirmPassword",
            "value": "",
            "type": "password"
        }
    ]);
    const mutation = useMutation({
        mutationFn: updateEntry,
    });


    return (

        <div className="mx-auto mt-4">
            <Banner/>
            <div className="w-full flex justify-center items-center mt-5 flex-col">
                <Card fullWidth className="max-w-full w-[400px]">
                    <CardBody className="overflow-hidden">
                        <form className="flex flex-col justify-center space-y-4">
                            {creditentials.map((input, index) => (
                                <div key={index}>
                                    <p className=" text-small mb-2">{input.label}</p>
                                    <Input key={index}
                                           type={input.type}
                                           placeholder={"Entrer votre " + input.label.toLowerCase()}
                                           className="mb-2"
                                           radius="sm"
                                           name={input.name}
                                           size="lg"
                                    />
                                </div>
                            ))}

                            <div className="">
                                <p className="flex justify-center items-center m-1 p-2 text-sm">Vous avez deja un compte
                                    ? &nbsp;<Link size="sm" color="foreground" href="/login"> Se connecter</Link></p>
                                <Button
                                    type={"submit"}
                                    fullWidth
                                    onPress={async () => {
                                        setConnectionLoading(true);
                                        await handleSubmit().then(r => {
                                        });
                                    }}

                                    color="default"
                                    isLoading={connectionLoading}
                                    size="lg"
                                    radius="sm"
                                >
                                    Créer mon compte
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

