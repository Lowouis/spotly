import {useEffect, useState} from 'react';
import {Input} from "@nextui-org/input";
import {Checkbox} from "@nextui-org/react";
import {addToast} from "@heroui/toast";
import {Button} from "@nextui-org/button";
import {useEmail} from "@/app/context/EmailContext";
import {getEmailTemplate} from "@/app/utils/mails/templates";
import {constructDate} from "@/app/utils/global";
import {useSession} from 'next-auth/react';

export default function SMTPSettings() {
    const [smtpConfig, setSmtpConfig] = useState({
        host: process.env.NEXT_PUBLIC_SMTP_HOST || '',
        port: process.env.NEXT_PUBLIC_SMTP_PORT  || 25 ,
        secure: process.env.NEXT_PUBLIC_SMTP_SECURE === 'true',
        from: process.env.NEXT_PUBLIC_EMAIL_USER || null,
    });
    const {data: session } = useSession();
    const [testEmail, setTestEmail] = useState();
    const {mutate: sendMail} = useEmail();

    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        setSmtpConfig(prev => ({
            ...prev,
            from: process.env.NEXT_PUBLIC_EMAIL_USER || '',
        }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        addToast({
            title: 'Configuration SMTP',
            description: 'Configuration sauvegardée avec succès',
            color: 'success',
            duration: 5000,
            variant: "flat"
        });
    };
    const testConnection = async () => {
        setIsTesting(true);
        try {
            const response = await fetch('/api/mail/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({smtpConfig, user: session?.user.email}),
            });

            const data = await response.json();
            if (response.ok) {
                addToast({
                    title: 'Test de connexion SMTP',
                    description: 'La connexion au serveur SMTP a réussi!',
                    color: 'success',
                    duration: 5000,
                    variant: "flat"
                });
            } else {
                addToast({
                    title: 'Échec du test SMTP',
                    description: 'Impossible de se connecter au serveur SMTP',
                    color: 'danger',
                    duration: 5000,
                    variant: "flat"
                });
            }
        } catch (error) {
            addToast({
                title: 'Erreur',
                description: 'Une erreur s\'est produite lors du test de connexion',
                color: 'danger',
                duration: 5000,
                variant: "flat"
            });
        } finally {
            setIsTesting(false);
        }
    };


    const handleMailTest = async () => {
        sendMail({
            "to": testEmail,
            "subject": "Test de mail de spotly - " + constructDate(new Date()),
            "text": getEmailTemplate("test", {})
        });
        addToast({
            title: 'Email de test envoyé',
            description: 'Un email de test a été envoyé à ' + testEmail,
            color: 'success',
            duration: 5000,
            variant: "flat"
        })
    }
    return (
        <div
            className="flex flex-col p-6 rounded-lg shadow-sm h-full w-full space-y-2 justify-start items-start bg-white">
            <h2 className="text-xl font-semibold mb-4">Configuration SMTP</h2>
            <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4 ">
                <div className="flex-1">
                    <Input
                        color={"default"}
                        label="Serveur SMTP"
                        labelPlacement="outside"
                        type="text"
                        value={smtpConfig.host}
                        onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})}
                    />
                </div>

                <div>
                    <Input
                        type="number"
                        color={"default"}
                        label="Port"
                        labelPlacement="outside"
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig({...smtpConfig, port: parseInt(e.target.value)})}
                    />
                </div>

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <div className="ml-3 text-sm">
                            <Checkbox
                                color={"default"}
                                size={"md"}
                                disableAnimation
                                radius={"lg"}
                                checked={smtpConfig.secure}
                                onChange={(e) => setSmtpConfig({...smtpConfig, secure: e.target.checked})}
                            >
                                Connexion sécurisée (TLS)
                            </Checkbox>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email expéditeur</label>
                    <Input
                        type="email"
                        color={"default"}
                        variant={'flat'}
                        placeholder="spotly@domain.fr"
                        value={smtpConfig.from}
                        onChange={(e) => setSmtpConfig({...smtpConfig, from: e.target.value})}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        color={"default"}
                        type="button"
                        variant="flat"
                        onPress={testConnection}
                        isLoading={isTesting}
                    >
                        Tester la connexion
                    </Button>
                    <Button
                        type="submit"
                        color={"primary"}
                        variant={"flat"}
                    >
                        Sauvegarder
                    </Button>
                </div>
            </form>
        </div>
    );
}
