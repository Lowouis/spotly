import React, {createContext, useContext, useState} from 'react';
import {useMutation} from "@tanstack/react-query";
import {addToast} from "@/lib/toast";

const EmailContext = createContext();

export const EmailProvider = ({ children }) => {
    const [emailError, setEmailError] = useState({"type": "", "message": ""});
    const mutation = useMutation({
        mutationFn: async (emailData) => {
            if (!emailData.templateName || !emailData.data) {
                throw new Error("templateName et data sont obligatoires !");
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/sendEmail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(emailData),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = result?.error || result?.message || 'Failed to send email';
                setEmailError({ type: "error", message });
                throw new Error(message);
            }

            if (result?.skipped) {
                throw new Error(result.message || 'Email skipped');
            }
            setEmailError({ type: "success", message: 'Email sent successfully!' });
            return result;
        },
        onError: (error) => {
            addToast({
                title: "Erreur d'envoi",
                description: error.message || "Une erreur est survenue lors de l'envoi de l'email. Vérifier que votre email est valide.",
                color: "danger"
            })
            setEmailError({ type: "error", message: error.message || 'Failed to send email' });
        }
    });


    return (
        <EmailContext.Provider value={{ ...mutation, emailError }}>
            {children}
        </EmailContext.Provider>
    );
};

export const useEmail = () => {
    return useContext(EmailContext);
};
