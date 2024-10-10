'use client';

import Input from "@/app/components/input";
import Button from "@/app/components/button";
import Banner from "@/app/components/banner";
import {useState} from "react";
import {signIn, signOut} from "next-auth/react";

export function ConnectionModal({}){



    const [creditentials, setCreditentials] = useState([
        {
            "label" : "Nom d'utilisateur",
            "name" :  "login",
            "value" : "",
            "type" : "text"
        },
        {
            "label" : "Mot de passe",
            "name" :  "password",
            "value" : "",
            "type" : "password"
        }
    ]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await signIn('credentials', {
            redirect: false,
            username: creditentials[0].value,
            password: creditentials[1].value,
        });

        if (result?.error) {
            // Gérer l'erreur de connexion
            console.error(result.error);
        }

    };

    const handleChange = (e, index) => {
        const { name, value } = e.target;
        setCreditentials(prevState => {
            const newState = [...prevState];
            newState[index].value = value;
            return newState;
        });
    }
    return (

        <div className="mx-auto mt-4">
            <Banner />
            <div className="p-3 rounded-lg border-2 border-b-blue-600 bg-blue-100">
                <div className="p-4">
                    <h1 className="text-2xl font-bold text-blue-800 mb-2">Identification</h1>
                    {creditentials.map((input, index) => (
                        <Input key={index} type={input.type} label={input.label} name={input.name} input={input} onChange={(e) => handleChange(e, index)}/>
                    ))}

                    <Button label="Connexion"
                            onClick={async(e) => {
                                await handleSubmit(e)
                            }}
                    />
                    <Button label="Connexion avec Github"
                            onClick={async() => {
                                await signIn()
                            }}
                    />
                </div>
            </div>
        </div>
    );
}