'use client';

import React, {useEffect, useState} from "react";
import {Button, Form, Input, Link} from "@nextui-org/react";
import {signIn} from "next-auth/react";
import {useRouter} from 'next/navigation';
import {addToast} from "@heroui/toast";

export default function LoginTab() {
    const router = useRouter();
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [wrongCredentials, setWrongCredentials] = useState(false);
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
        }
    ]);

    // Copy the handlers and effects related to login
    const handleSubmit = async () => {
        const result = await signIn('credentials', {
            redirect: false,
            username: creditentials[0].value,
            password: creditentials[1].value,
        }).then((response) => {
            console.log(response);
            if (response.status === 401) {
                setWrongCredentials(true);
            }
            if (response.ok) {
                router.push('/');
            }
            setConnectionLoading(false);
        });

    };

    const handleChange = (e, index) => {
        const {name, value} = e.target;
        setCreditentials(prevState => {
            const newState = [...prevState];
            newState[index].value = value;
            return newState;
        });
    }

    useEffect(() => {
        if (wrongCredentials) {
            addToast({
                title: "Erreur d'authentification",
                description: "Nom d'utilisateur ou mot de passe incorrect",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
            setWrongCredentials(false);
        }
    }, [wrongCredentials, setWrongCredentials]);

    return (
        <Form className="flex flex-col justify-center space-y-4">
            {creditentials.map((input, index) => (
                <div key={index} className="w-full">
                    <p className=" text-small mb-2">{input.label}</p>
                    <Input key={index}
                           type={input.type}
                           placeholder={"Entrer votre " + input.label.toLowerCase()}
                           className="mb-2"
                           radius="sm"
                           name={input.name}
                           size="lg"
                           onChange={(e) => handleChange(e, index)}
                    />
                </div>
            ))}

            <div className="w-full">
                <p className="flex justify-center items-center m-1 p-2 text-sm">Vous n&#39;avez
                    pas de compte ?&nbsp; <Link underline="hover" size="sm" color="foreground"
                                                href="/register">Créer
                        un compte</Link></p>
                <Button
                    type={"submit"}
                    fullWidth
                    onPress={async () => {
                        setConnectionLoading(true);
                        await handleSubmit().then(r => {
                        });
                    }}

                    color="success"
                    isLoading={connectionLoading}
                    size="lg"
                    radius="sm"
                >
                    {!connectionLoading ? "Connexion" : "En cours de connexion"}
                </Button>
            </div>
        </Form>
    );
}