'use client';

import Banner from "@/components/utils/banner";
import React, {useState} from "react";
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import {Card, CardBody, Link,} from "@nextui-org/react";
import {useMutation} from "@tanstack/react-query";
import {addToast} from "@heroui/toast";

export async function createUser(creditentials) {
    const test = creditentials.reduce((acc, creditential) => {
        acc[creditential.name] = creditential.value;
        return acc;
    }, {})
    console.log(test);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(
            creditentials.reduce((acc, creditential) => {
                acc[creditential.name] = creditential.value;
                return acc;
            }, {})
        ),
    });
    if (!response.ok) {
        addToast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la création de votre compte",
            type: "error",
        })
        throw new Error('Failed to create user');
    }
    return response.json();
}

export function RegisterModal({}) {
    const [selected, setSelected] = useState("login");
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [creditentials, setCreditentials] = useState([
        {
            "label": "Nom d'utilisateur",
            "name": "username",
            "value": "",
            "type": "text"
        },
        {
            "label": "Prénom",
            "name": "name",
            "value": "",
            "type": "text"
        },
        {
            "label": "Nom",
            "name": "surname",
            "value": "",
            "type": "text"
        },
        {
            "label": "Email",
            "name": "email",
            "value": "",
            "type": "email"
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
        mutationFn: createUser,
        onError: () => {
            addToast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la création de votre compte",
                type: "error",
            })
            setConnectionLoading(false);
        },
        onSuccess: () => {
            setConnectionLoading(false);
            setCreditentials(creditentials.map(cred => ({...cred, value: ""})));
            window.location.href = "/login";
            addToast({
                title: "Succès",
                description: "Votre compte a été créé avec succès",
                type: "success",
            })

        }
    });

    const handleSubmit = () => {

        mutation.mutate(
            creditentials
        )

    }
    


    return (
        <div className="mx-auto mt-4">
            <Banner/>
            <div className="w-full flex justify-center items-center mt-5 flex-col">
                <Card fullWidth className="max-w-full w-[400px] border-2" shadow="none">
                    <CardBody className="overflow-hidden">
                        <form className="flex flex-col justify-center space-y-4">
                            {creditentials.map((input, index) => (
                                <div key={index}>
                                    <p className=" text-small mb-2">{input.label}</p>
                                    <Input
                                        key={index}
                                        type={input.type}
                                        placeholder={"Entrer votre " + input.label.toLowerCase()}
                                        className="mb-2"
                                        radius="sm"
                                        isRequired={true}
                                        name={input.name}
                                        value={input.value}
                                        onChange={(e) => {
                                            const newCreditentials = [...creditentials];
                                            newCreditentials[index].value = e.target.value;
                                            setCreditentials(newCreditentials);
                                        }}
                                        errorMessage={() => {
                                            if (input.type === "password" && input.value.length < 8) {
                                                return "Le mot de passe doit contenir au moins 8 caractères";
                                            } else if (input.name === "confirmPassword" && input.value !== creditentials.find(cred => cred.name === "password").value) {
                                                return "Les mots de passe ne correspondent pas";
                                            }
                                            return "";
                                        }}
                                        validate={() => {
                                            if (input.type === "password" && input.value.length < 8) {
                                                return false;
                                            } else if (input.name === "confirmPassword" && input.value !== creditentials.find(cred => cred.name === "password").value) {
                                                return false;
                                            }
                                            return true;
                                        }}
                                        size="lg"
                                    />
                                </div>
                            ))}

                            <div className="">
                                <p className="flex justify-center items-center m-1 p-2 text-sm">Vous avez deja un compte
                                    ? &nbsp;<Link underline="hover" size="sm" color="foreground" href="/login"> Se
                                        connecter</Link></p>
                                <Button
                                    type={"submit"}
                                    fullWidth
                                    onPress={async () => {
                                        setConnectionLoading(true);
                                        handleSubmit()
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



