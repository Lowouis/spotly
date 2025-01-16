'use client';

import {Avatar, Image, Skeleton, Tab, Tabs, User} from "@nextui-org/react";
import {useSession} from "next-auth/react";
import {Button} from "@nextui-org/button";
import {Input} from "@nextui-org/input";
import {Form} from "@nextui-org/form";
import {useState} from "react";


export default function Page() {
    const { data } = useSession();
    const [submitted, setSubmitted] = useState(null);

    const onSubmit = (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(e.currentTarget));

        setSubmitted(data);
    };
    console.log(data);
    return (
        <div className="mx-10 p-2 w-full">
            <div className="w-full mb-10">
                <div className="flex w-full p-5">
                    <div className="text-2xl w-1/3">
                        <a href="/" className="ml-5">
                            <Image
                                className=""
                                alt="spotly_logo"
                                src="logo.png"
                                width={100}
                            />
                        </a>
                    </div>
                </div>
            </div>
                    <Tabs aria-label="Options" size="lg" isVertical={true} variant="solid">
                        <Tab key="photos" title="Profile" className="">
                            <div className="mt-2 text-2xl">
                                <div className="flex flex-col">
                                    <Skeleton isLoaded={data} className="rounded-lg">
                                        <User
                                            size="xl"
                                            avatarProps={{
                                                src: "https://www.pngfind.com/pngs/m/93-938050_png-file-transparent-white-user-icon-png-download.png",
                                                size: "lg",
                                                data: data?.user?.name + " " + data?.user?.surname,
                                                title: data?.user?.role,
                                            }}
                                            description={data?.user?.role}
                                            name={data?.user?.name + " " + data?.user?.surname}
                                        >
                                            <Avatar size="lg" src="https://i.pravatar.cc/150?u=a04258114e29026302d"/>
                                        </User>
                                    </Skeleton>
                                    <div className="flex flex-col space-y-2 text-xl text-slate-600">
                                        <Form className="w-full max-w-xs" validationBehavior="native"
                                              onSubmit={onSubmit}>
                                            <Input
                                                width="full"
                                                errorMessage="Entrer un email valide"
                                                label="Email"
                                                disabled={data?.user?.external}
                                                value={data?.user?.email}
                                                labelPlacement="outside"
                                                name="email"
                                                placeholder="Enter your email"
                                                type="email"
                                                description={data?.user?.external && "Cette donnée est automatiquement configurer par LDAP."}

                                            />
                                            <Input
                                                width="full"
                                                errorMessage="Entrer un email valide"
                                                label="Mot de passe"
                                                disabled={data?.user?.external}
                                                value=""
                                                labelPlacement="outside"
                                                name="email"
                                                placeholder="****************"
                                                type="password"
                                                description={data?.user?.external && "Cette donnée est automatiquement configurer par LDAP."}

                                            />
                                            <Button type="submit" variant="flat" className="w-full">
                                                Enregistrer
                                            </Button>
                                        </Form>
                                    </div>

                                </div>
                            </div>
                        </Tab>
                        <Tab key="user_settings" title="Réglages">

                        </Tab>
                        <Tab key="about" title="A propos" className="">
                            <div className="space-y-5 w-1/3">
                                <h1 className="text-2xl text-slate-800 font-semibold mb-5">Spotly</h1>
                                <p>Spotly est une application open source de gestion et de réservation de ressources pour les entreprises. Elle permet aux employés de réserver et d'organiser efficacement l'utilisation de ressources partagées telles que les salles, les équipements, les véhicules, etc. Grâce à une interface intuitive et des fonctionnalités avancées de gestion des créneaux, Spotly simplifie la planification et optimise l’utilisation des ressources.</p>
                                <p>Logiciel libre disponible sur github</p>
                                <div className="flex flex-col">
                                    <span className="font-thin ">Pour toutes questions ou support, merci de me contacter à <span
                                        className="font-thin italic">louisguritapro@gmail.com</span></span>
                                    <span className="font-bold uppercase ">Version A0.1</span>
                                </div>
                            </div>

                        </Tab>
                    </Tabs>
        </div>
    )
}