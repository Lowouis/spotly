import React, {createContext, useContext, useState} from 'react';
import {useMutation} from "@tanstack/react-query";
import {addToast} from '@heroui/toast';

const EmailContext = createContext();

export const EmailProvider = ({ children }) => {
    const [emailError, setEmailError] = useState({"type": "", "message": ""});
    const mutation = useMutation({
        mutationFn: async (emailData) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/sendEmail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });

            if (!response.ok) {
                setEmailError({ type: "error", message: 'Failed to send email' });
                throw new Error('Failed to send email');
            }

            const result = await response.json();
            console.log('Email sent successfully:', result);
            setEmailError({ type: "success", message: 'Email sent successfully!' });
            return result;
        },
        onError: (error) => {
            addToast({
                title: "Erreur d'envoi",
                description: "Une erreur est survenue lors de l'envoi de l'email. Vérifier que votre email est valide.",
                color: "danger"
            })
            setEmailError({ type: "error", message: 'Failed to send email' });
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
