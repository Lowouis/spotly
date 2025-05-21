'use client';

import {Modal, ModalBody, ModalContent, Spinner} from "@nextui-org/react";

export default function SSOLoadingModal() {
    return (
        <Modal
            isOpen={true}
            hideCloseButton={true}
            isDismissable={false}
            classNames={{
                base: "bg-background/80 backdrop-blur-md",
                wrapper: "bg-background/80 backdrop-blur-md"
            }}
        >
            <ModalContent>
                <ModalBody className="flex flex-col items-center justify-center py-8">
                    <Spinner size="lg" color="primary"/>
                    <p className="mt-4 text-lg font-medium">Connexion SSO en cours...</p>
                    <p className="text-sm text-default-500">Veuillez patienter pendant que nous vous connectons</p>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
} 