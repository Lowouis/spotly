'use client';
import Title from "@/app/components/utils/title";
import {Switch} from "@nextui-org/react";
import {useState} from "react";
import {Textarea} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";


export default function ReservationFormConfirmation({setSummary}) {

    const [comment, setComment] = useState(false);
    const  handleCommentSwitch = () => {
        console.log("Switched");
        //add comment form
        setComment(!comment);
    }

    const handleReturn = () => {
        console.log("Return");
        setSummary(false);
    }
    const handleConfirmation = () => {
        console.log("Confirmation");
    }
    return (
        <div className="flex flex-col space-y-6 my-4">
            <Title title="Récapitulatif de votre réservation #3244" />
            <div>
                <span className={`text-xl font-bold text-slate-500`}>
                    Reservation de la ressource <span className="text-slate-700">LAPTOP10</span>
                </span>
            </div>
            <div className="flex flex-row items-center space-x-2">
                <ExclamationTriangleIcon width="24" height="24" color="red" />
                <span className={`text-lg font-medium text-red-500`}>
                    Cette ressource est soumise à la confirmation d'un administrateur.
                </span>
            </div>

            <div className="flex flex-col space-y-2 text-lg">
                <div>
                    <span className="text-slate-700">Date de début:</span> <span className="text-slate-500"> 10/10/2021 10h00</span>
                </div>
                <div>
                    <span className="text-slate-700">Date de fin:</span> <span className="text-slate-500"> 10/10/2021 10h00</span>
                </div>
                <Switch
                    size="md"
                    name="comment"
                    id="comment"
                    color="primary"
                    className="mb-2"
                    onClick={(e) => {
                    handleCommentSwitch()
                }}
                >
                    Ajouter un commentaire
                </Switch>
                <Textarea
                    isDisabled={!comment}
                    id="description"
                    isHidden={!comment}

                    labelPlacement="outside"
                    placeholder="Ecrire un commentaire"
                />
                <Switch
                    size="md"
                    name="key"
                    id="key"
                    color="primary"
                    className="mb-2"
                >
                    Clef empruntée
                </Switch>
                <div>
                    <span className={`flex flex-col space-y-2  text-slate-700 mt-6`}>
                        <span className="font-bold">Conditions d'utilisation </span>
                        <span className="text-slate-500">La ressource doit être restituer dans le delai indiqué, pour confirmer le retour d'une ressource un code 6 chiffres vous est
                        envoyé par mail.
                        </span>
                        <Switch
                            required={true}
                            size="md"
                            name="cgu"
                            id="cgu"
                            color="primary"
                            className="mb-2"
                        >
                            J'accepte les conditions
                        </Switch>
                </span>
                </div>
                <div className="flex flex-row space-x-2">
                    <Button size="lg" color="secondary" onClick={handleReturn}>Retour</Button>
                    <Button size="lg" color="primary" onClick={handleConfirmation}>Confirmer la réservation</Button>
                </div>
            </div>
        </div>
    )
}