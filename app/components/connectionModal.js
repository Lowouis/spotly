'use client';

import Banner from "@/app/components/utils/banner";
import React, {useState} from "react";
import {signIn} from "next-auth/react";
import {redirect, useRouter} from 'next/navigation'
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import {
    Alert,
    Card,
    CardBody,
    Divider,
    InputOtp,
    Modal, ModalBody,
    ModalContent, ModalFooter,
    ModalHeader, Skeleton,
    Tab,
    Tabs,
    useDisclosure
} from "@nextui-org/react";
import Link from "next/link";
import {ArrowRightCircleIcon} from "@heroicons/react/24/solid";
import {useQuery} from "@tanstack/react-query";
import {ClockIcon} from "@heroicons/react/24/outline";

export function ConnectionModal({}) {

    const router = useRouter();
    const [selected, setSelected] = useState("login");
    const [wrongPassword, setWrongPassword] = useState(false);
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
    const [ifl, setIfl] = useState({"username": "", "otp": ""});
    const [authorized, setAuthorized] = useState(false);
    const [userAlert, setUserAlert] = useState({"type" : "", "message" : ""});
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [submitLuckyEntry, setSubmitLuckyEntry] = useState(false);

    const handleSubmit = async () => {
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
            console.error("Error : ", result.error);
        }
    };

    const {data: entry, isLoading, isError, error, refetch} = useQuery({
        queryKey: ['lucky_entry'],
        queryFn: async () => {
            if(ifl.otp.length === 6){
                const response = await fetch('http://localhost:3000/api/entry?returnedConfirmationCode=' + ifl.otp);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                return data[0];
            }
            return null;
        },
    });


    const handleSubmitLuckyEntry = async () => {
        if(ifl.otp.length === 6){
            try {
                await refetch();  // Attend la fin de la requête
                if (entry.resource.pickable === "HIGH_AUTH" || entry.resource.category.pickable === "HIGH_AUTH" || entry.resource.domains.pickable === "HIGH_AUTH" && entry.user.username === ifl.username) {
                    setAuthorized(true);
                } else {
                    setAuthorized(false);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'entry:", error);
            }
        }


    }
    const handleChange = (e, index) => {
        const {name, value} = e.target;
        setCreditentials(prevState => {
            const newState = [...prevState];
            newState[index].value = value;
            return newState;
        });
    }

    const handleIFLActions = async () => {
        if(entry.moderate === "ACCEPTED"){
            console.log("Récupération de l'objet");
            setUserAlert({"type" : "primary", "message" : "La prise de la ressource a bien été enregistrée"});
        } else if (entry.moderate === "USED"){
            console.log("Retour de l'objet");
            setUserAlert({"type" : "success", "message" : "La ressource à bien été retourner."});

        }
    }

    return (

        <div className="mx-auto mt-4">
            <Banner/>
            <div className="w-full flex justify-center items-center mt-5 flex-col">
                <Card fullWidth className="max-w-full w-[400px] h-[350px]">
                    <CardBody className="overflow-hidden">
                        <Tabs
                            fullWidth
                            aria-label="tabs_anons_actions"
                            selectedKey={selected}
                            size="lg"
                            onSelectionChange={setSelected}
                        >
                            <Tab key="login" title="Se connecter">
                                <form className="flex flex-col justify-center space-y-4">
                                    {wrongPassword &&
                                        <div className="my-2">
                                            <p className="text-red-600 font-bold text-xs">Identifiant ou mots de passe
                                                incorrects</p>
                                        </div>
                                    }
                                    {creditentials.map((input, index) => (
                                        <div key={index}>
                                            <p className="text-default-700 text-small mb-2">{input.label}</p>
                                            <Input key={index}
                                                   type={input.type}
                                                   placeholder={"Entrer votre " + input.label.toLowerCase()}
                                                   className="mb-2"
                                                   name={input.name}
                                                   size="lg"
                                                   onChange={(e) => handleChange(e, index)}/>
                                        </div>
                                    ))}

                                    <div className="">
                                        <Button fullWidth onPress={async (e) => {
                                            await handleSubmit()
                                        }}
                                                color="primary"
                                                size="lg"
                                        >
                                            Connexion
                                        </Button>
                                    </div>
                                </form>
                            </Tab>
                            <Tab key="sign-up" title="J'ai réservé">
                                <form className="flex flex-col space-y-4 h-[600px] justify-start">

                                    <div>
                                        <p className="text-default-700 text-small mb-2">Nom d&#39;utilisateur</p>
                                        <Input name="lucky_username"
                                               isRequired
                                               size="lg"
                                               placeholder="Entrer votre nom d'utilisateur"
                                               type="text"
                                               onChange={(e) => setIfl({...ifl, "username": e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-default-700 text-small mb-2">Code de réservation</p>
                                        <div className="flex justify-center">
                                            <InputOtp
                                                name="lucky_otp"
                                                size="lg"
                                                length={6}
                                                onChange={(e) => setIfl({...ifl, "otp": e.target.value})}
                                            />
                                        </div>
                                    </div>


                                    <div className="flex gap-2 items-end">
                                        <Button
                                            size="lg"
                                            fullWidth
                                            color="primary"
                                            onPress={() => {
                                                handleSubmitLuckyEntry().then(r => {
                                                    onOpen();
                                                });
                                            }}
                                        >
                                            Confirmer
                                        </Button>
                                    </div>
                                </form>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
                <Link target="_blank" href="https://github.com/Lowouis/spotly">
                    <h2 className="flex text-blue-200 text-xl hover:cursor-pointer hover:text-blue-400 transition font-bold py-2 px-4 rounded">
                        Spotly
                    </h2>
                </Link>
            </div>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <Skeleton isLoaded={!isLoading}>
                                    {entry?.resource.name}
                                </Skeleton>
                            </ModalHeader>
                            <ModalBody>
                                    { entry.moderate === "ACCEPTED" || entry.moderate === "USED" && entry.startDate <= new Date().toISOString() ?
                                        <div>
                                            {userAlert.message !== "" &&
                                                <div className="mb-6">
                                                    <Alert
                                                    title="Information"
                                                    fullWidth
                                                    color={userAlert.type}
                                                    variant="faded"
                                                    onPress={handleIFLActions}
                                                    description={userAlert.message}
                                                    isClosable
                                                    />
                                                </div>

                                                }
                                            <div className="flex flex-row w-full text-sm uppercase font-semibold mb-5">
                                                <div className="flex justify-start items-center w-2/5 ">
                                                    { new Date(entry?.startDate).toLocaleString("fr-FR", {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="w-1/5 relative">
                                                    <div
                                                    className="animate-ping absolute inset-1 inset-x-10 -inset-y-0.5  h-6 w-6 inline-flex rounded-full bg-sky-400 opacity-75"></div>
                                                    <ArrowRightCircleIcon className="absolute inset-0 m-auto" width="32"
                                                    height="32" color="blue"/>
                                                </div>
                                                <div className="flex justify-end items-center w-2/5">
                                                    {new Date(entry?.endDate).toLocaleString("fr-FR", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            {userAlert.message === "" &&
                                                <Button
                                                fullWidth
                                                color={entry?.moderate === "ACCEPTED" ? "primary" : "danger"}
                                                variant="flat"
                                                onPress={handleIFLActions}
                                                >
                                                    {entry?.moderate === "ACCEPTED" && "Récupérer"}
                                                    {entry?.moderate === "USED" && "Retourner"}
                                                </Button>
                                            }



                                            { new Date(entry.endDate) < new Date() &&
                                                <div className="flex flex-col justify-start items-center mt-3">
                                                    <span className="font-semibold text-red-500">En retard</span>
                                                     <div className="flex flex-row space-x-1 text-red-400 font-semibold">
                                                        <span>
                                                            {new Date(new Date(entry.endDate) - new Date()).toLocaleString("FR-fr", {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        <ClockIcon className="h-5 w-5 inline-block mr-2  "/>
                                                    </div>
                                                </div>
                                            }
                                        </div> :
                                        <div className="text-center">
                                            Votre réservation n'est pas accessible par cette interface
                                            {entry?.moderate === "REJECTED" && " car elle a été refusée."}
                                            {entry?.moderate === "ENDED" && " car elle est terminée."}
                                            {entry?.moderate === "WAITING" && " car elle est en attente de validation d'un administrateur."}
                                        </div>
                                    }
                            </ModalBody>

                            <ModalFooter>
                                <Button color="danger" variant="light"
                                        onPress={()=>{
                                            setIfl({"username": "", "otp": ""});
                                            onClose();
                                        }}
                                >
                                    Fermer
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

