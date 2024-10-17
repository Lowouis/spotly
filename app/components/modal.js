'use client';

import Input from "@/app/components/utils/input";
import Button from "@/app/components/utils/button";
import Banner from "@/app/components/utils/banner";
import {useState} from "react";
import {signIn} from "next-auth/react";
import { useRouter } from 'next/navigation'

export function ConnectionModal({}){

    const router = useRouter();

    const [wrongPassword, setWrongPassword] = useState(false);
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
        }).then((response) => {
            if (response.status === 401) {
                setWrongPassword(true);
            }
            if (response.ok) {
                setWrongPassword(false);

                router.push('/');
            }
        });

        if (result?.error) {
            console.error("Error : " , result.error);
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
                    {wrongPassword &&
                        <div className="my-2">
                            <p className="text-red-600 font-bold">Identifiant ou mots de passe incorrects</p>
                        </div>
                    }
                    <Button label="Connexion"
                            onClick={async(e) => {
                                await handleSubmit(e)
                            }}
                    />
                    
                </div>
            </div>
        </div>
    );
}