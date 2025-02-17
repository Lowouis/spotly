'use client';

import Banner from "@/app/components/utils/banner";
import React, {useState} from "react";
import {signIn} from "next-auth/react";
import { useRouter} from 'next/navigation'
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import {
    Alert,
    Card,
    CardBody,
    InputOtp,
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
import {lastestPickable} from "@/app/utils/global.js";

export async function updateEntry({setUserAlert, id, moderate, returned=false}) {
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
        setUserAlert({"type" : "danger", "message" : "Erreur lors de la mise à jour de la réservation."});
        throw new Error('Failed to update entry');
    }
    return response.json();
}

export function ConnectionModal({}) {
    const queryClient = useQueryClient();
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
    const [userAlert, setUserAlert] = useState({"type" : "", "message" : ""});
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

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

    const mutation = useMutation({
        mutationFn : updateEntry,
    });


    const {data: entry, refetch} = useQuery({
        queryKey: ['lucky_entry'],
        queryFn: async () => {
            if(ifl.otp.length === 6){
                const response = await fetch(`${process.env.API_ENDPOINT}/api/entry?returnedConfirmationCode=` + ifl.otp);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                return data[0];
            }
            return null;
        },
    });

    const fetchIP = async () => {
        const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+"/api/ip");
        if (!res.ok) throw new Error("Erreur lors de la récupération de l'IP");
        return res.json();
    }

    const {data:clientIP } = useQuery({
        queryKey: ['clientIP'],
        queryFn: fetchIP,
    });


    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/user`);
            return response.json();
        }
    });

    const handleSubmitLuckyEntry = async () => {
        if(ifl.otp.length === 6){
            refetch();
            //checker IP dans la plage autorisée si HIGH_AUTH

            return true; // Attend la fin de la requête
        }
        return false;
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
            mutation.mutate({setUserAlert: setUserAlert, id: entry.id, moderate: "USED"});
            setUserAlert({"type" : "primary", "message" : "La prise de la ressource a bien été enregistrée. A la prochaine connexion sur cette inteface vous pourrez retourner votre ressource."
            });
        } else if (entry.moderate === "USED"){
            mutation.mutate({setUserAlert: setUserAlert, id: entry.id, moderate: "ENDED", returned:true});
            setUserAlert({"type" : "success", "message" : "La ressource à bien été retourner."});
        }
        await refetch();
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
                                        <Button fullWidth onPress={async () => {
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
                                <form className="flex flex-col space-y-4 justify-between">
                                    <div>
                                        <p className="text-default-700 text-small mb-2">Code de réservation</p>
                                        <div className="flex justify-center">
                                            <InputOtp
                                                isRequired
                                                name="lucky_otp"
                                                size="lg"
                                                length={6}
                                                value={ifl.otp}
                                                onChange={(e) => setIfl({...ifl, "otp": e.target.value})}
                                            />
                                        </div>
                                        <div className="font-thin text-sm text-neutral-500 mt-2 ">
                                            <div className="flex justify-center items-center space-x-4">
                                                Je n&apos;ai pas de réservation <Tooltip content="Pour réserver une ressource rendez-vous dans la section 'Se connecter'.">
                                                <Button onPress={()=>{setSelected("login")}} isIconOnly size="sm" variant="flat" color="warning" className="ml-2"><span className="font-bold">?</span></Button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <Button
                                            size="lg"
                                            fullWidth
                                            color="primary"
                                            onPress={() => {
                                                handleSubmitLuckyEntry().then(r => {
                                                    if(r){onOpen();}
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
             
            </div>
            {entry !== null && <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                    {entry?.resource.name}
                            </ModalHeader>
                            <ModalBody>
                                {entry.moderate === "ACCEPTED" || entry.moderate === "USED"  && entry.startDate <= new Date().toISOString() && lastestPickable(entry)=== "HIGH_AUTH" || lastestPickable(entry) === "LOW_AUTH" ?
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
                                                {new Date(entry?.startDate).toLocaleString("fr-FR", {
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


                                        {new Date(entry.endDate) < new Date() &&
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
                                    <div className="text-center space-y-2 flex flex-col">
                                        <span className="font-bold">Votre réservation n&apos;est pas accessible par cette interface.</span>
                                        <span className="text-sm text-neutral-800">Pour la consulter, merci de vous connecter avec vos identifiants.</span>
                                    </div>
                                }
                            </ModalBody>

                            <ModalFooter>
                                <Button color="danger" variant="light"
                                        onPress={() => {
                                            setIfl({"username": "", "otp": ""});
                                            setUserAlert({"type": "", "message": ""});
                                            queryClient.removeQueries(['lucky_entry']);
                                            onClose();
                                        }}
                                >
                                    Fermer
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>}
        </div>
    );
}

