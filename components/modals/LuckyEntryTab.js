'use client';

import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {ArrowLeftCircleIcon, ArrowRightCircleIcon, ClockIcon} from "@heroicons/react/24/outline";
import {lastestPickable} from "@/global";
import {addToast} from "@/lib/toast";
import {getURL} from "@/services/client/api";

export default function LuckyEntryTab({setSelected}) {
    const [ifl, setIfl] = useState({"username": "", "otp": ""});
    const [isOpen, setIsOpen] = useState(false);

    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleResourceAction = async () => {
        setIsActionLoading(true);
        try {
            if (entry.moderate === "ACCEPTED") {
                const response = await fetch(getURL('/api/entry/code-action'), {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code: ifl.otp, action: 'pickup'}),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.message || 'Récupération impossible');
                setEntry(payload);
                addToast({title: 'Récupération', description: 'La récupération de la ressource a bien été prise en compte.', color: 'success', timeout: 5000});
            } else if (entry.moderate === "USED") {
                const response = await fetch(getURL('/api/entry/code-action'), {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({code: ifl.otp, action: 'return'}),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.message || 'Restitution impossible');
                setEntry(payload);
                setIsOpen(false);
                addToast({title: 'Restitution', description: 'La ressource a bien été retournée.', color: 'success', timeout: 5000});
            }
        } catch (error) {
            addToast({title: 'Erreur', description: error.message || 'Action impossible.', color: 'danger', timeout: 5000});
        } finally {
            setIsActionLoading(false);
        }
    };

    const fetchEntry = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(getURL(`/api/entry?returnedConfirmationCode=${ifl.otp}`));
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const result = data.length > 0 ? data[0] : null;

            if (result && (lastestPickable(result)?.name === "HIGH_AUTH" || lastestPickable(result)?.name === "LOW_AUTH")) {
                setEntry(result);
                setIsOpen(true);
            } else {
                addToast({
                    title: "Erreur d'authentification",
                    description: "Code de réservation invalide.",
                    timeout: 5000,
                    color: "danger"
                });
            }
        } catch (error) {
            addToast({
                title: "Erreur d'authentification",
                description: "Une erreur à eu lieu lors de récupération de votre réservation.",
                timeout: 5000,
                color: "danger"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form
                className="space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (ifl.otp.length === 6) {
                        fetchEntry();
                    }
                }}
            >
                {/* En-tête */}
                <div className="text-center space-y-2 w-full">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Accéder à ma réservation
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Entrez le code à 6 chiffres de votre réservation
                    </p>
                </div>

                {/* Champ OTP */}
                <div className="space-y-4 w-full">
                    <div className="w-full flex justify-center">
                        <Input
                            required
                            name="lucky_otp"
                            maxLength={6}
                            value={ifl.otp}
                            onChange={(e) => setIfl({...ifl, "otp": e.target.value.replace(/\D/g, '').slice(0, 6)})}
                            className="h-12 max-w-48 text-center tracking-[0.5em] bg-transparent border-2 border-neutral-300 dark:border-neutral-600 text-sm focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors duration-200"
                        />
                    </div>


                    <div className="flex w-full justify-center">
                        <Button
                            type="submit"
                            className="h-11 min-w-44 font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                            disabled={isLoading || ifl.otp.length !== 6}
                        >
                            {isLoading ? "Vérification..." : "Vérifier le code"}
                        </Button>
                    </div>
                </div>

                {/* Lien vers la connexion */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 w-full">
                    <div
                        className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Je n&apos;ai pas de réservation
                        </span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        onClick={() => setSelected("login")}
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
                                    >
                                        ?
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span>Pour réserver une ressource rendez-vous dans la section <span className="italic">Se connecter</span>.</span>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </form>

            {/* Modal des détails de réservation */}
            {entry !== null && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                <DialogHeader className="flex flex-col gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-700">
                                    <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                        {entry?.resource.name}
                                    </DialogTitle>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        État : <span className={`font-semibold ${
                                        new Date(entry.endDate) < new Date() && !entry.returned ? "text-red-500" :
                                            entry.moderate === "ACCEPTED" ? "text-amber-600" :
                                                entry.moderate === "USED" ? "text-blue-500" :
                                                    entry.moderate === "ENDED" ? "text-neutral-500" :
                                                        "text-neutral-500"
                                    }`}>
                                    {new Date(entry.endDate) < new Date() && !entry.returned ? "Expiré" :
                                        entry.moderate === "ACCEPTED" ? "Code valide" :
                                            entry.moderate === "USED" ? "En cours d'utilisation" :
                                                entry.moderate === "ENDED" ? "Terminé" :
                                                    "Non disponible"}
                                </span>
                                    </p>
                                </DialogHeader>

                                <div className="py-6">
                                    <div className="space-y-6">
                                        {/* Timeline des dates */}
                                        <div className="flex flex-row w-full text-sm uppercase font-medium">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-neutral-500">Début</p>
                                                <p className="text-neutral-900 dark:text-neutral-100 text-sm">{new Date(entry?.startDate).toLocaleString("fr-FR", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
                                            </div>
                                            <div className="w-16 flex items-center justify-center">
                                                <div className="relative">
                                                    <div
                                                        className="animate-ping absolute inset-0 rounded-full bg-neutral-400 opacity-20"></div>
                                                    <ArrowRightCircleIcon
                                                        className="relative z-10 w-6 h-6 text-neutral-500"/>
                                                </div>
                                            </div>
                                            <div className="flex-1 text-right space-y-1">
                                                <p className="text-neutral-500">Fin</p>
                                                <p className="text-neutral-900 dark:text-neutral-100 text-sm">{new Date(entry?.endDate).toLocaleString("fr-FR", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
                                            </div>
                                        </div>

                                        {/* Alerte d'expiration */}
                                        {new Date(entry.endDate) < new Date() && !entry.returned && (
                                            <div
                                                className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <ClockIcon className="w-4 h-4 text-red-500 mr-2"/>
                                                <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                                                    Réservation expirée
                                                </span>
                                            </div>
                                        )}

                                        {/* Boutons d'action */}
                                        {entry.moderate === "ACCEPTED" && new Date(entry.endDate) > new Date() && (
                                            <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        <ArrowRightCircleIcon className="h-5 w-5"/>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-neutral-950 dark:text-neutral-50">
                                                            Récupération par code
                                                        </p>
                                                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                                            Cliquez pour vérifier et prendre la ressource avec ce code.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="h-12 w-full font-medium bg-neutral-900 text-white transition-colors duration-200 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                                                    size="lg"
                                                    disabled={isActionLoading}
                                                    onClick={handleResourceAction}
                                                >
                                                    <ArrowRightCircleIcon className="w-4 h-4"/>
                                                    {isActionLoading ? 'Récupération...' : 'Récupérer la ressource'}
                                                </Button>
                                            </div>
                                        )}

                                        {entry.moderate === "USED" && (
                                            <Button
                                                className="w-full font-medium bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 h-12"
                                                size="lg"
                                                disabled={isActionLoading}
                                                onClick={handleResourceAction}
                                            >
                                                <ArrowLeftCircleIcon className="w-4 h-4"/>
                                                Restituer la ressource
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsOpen(false)}
                                        className="font-medium h-10"
                                    >
                                        Fermer
                                    </Button>
                                </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
