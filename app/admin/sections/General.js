import {useState} from 'react';
import {CiCamera, CiCircleAlert, CiCircleCheck} from 'react-icons/ci';
import {Button} from '@nextui-org/button';
import {addToast} from "@heroui/toast";
import Image from 'next/image';


export const General = () => {
    const [uploadState, setUploadState] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleBannerUpload = (file) => {
        if (!file) return;

        // Validation côté client
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            setUploadState({
                status: 'error',
                message: 'Format de fichier non supporté'
            });
            return;
        }

        if (file.size > maxSize) {
            setUploadState({
                status: 'error',
                message: 'Fichier trop volumineux (max 5Mo)'
            });
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('banner', file);

        fetch('/api/upload-banner', {
            method: 'POST',
            body: formData,
        })
            .then(async (response) => {
                if (!response.ok) {
                    const error = await response.json();
                    addToast({
                        title: 'Erreur de téléchargement',
                        description: error.message || 'Une erreur est survenue lors du téléchargement',
                        color: 'danger',
                        duration: 5000,
                        variant: "flat"
                    });
                    throw new Error(error.message || 'Erreur de téléchargement');
                }
                return response.json();
            })
            .then((data) => {
                setUploadState(data);
                // Réinitialiser l'input file
                document.getElementById('bannerUpload').value = '';
            })
            .catch((error) => {
                setUploadState({
                    status: 'error',
                    message: error.message
                });
            })
            .finally(() => {
                setIsLoading(false);
                // Reset du message après 5s
                setTimeout(() => setUploadState(null), 5000);
            });
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white bg-opacity-10 rounded-lg">
            <h3 className="text-lg font-light text-gray-600">Bannière du profil</h3>

            <div className="relative group w-full h-[200px] rounded-lg overflow-hidden">
                <Image
                    src="/banner.png"
                    width={1920}
                    height={1080}
                    alt="Bannière actuelle"
                    className="object-cover w-full h-full transition-opacity group-hover:opacity-75"
                />

                <div
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-40">
                    <Button
                        variant="solid"
                        color="default"
                        isLoading={isLoading}
                        className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
                        onPress={() => document.getElementById('bannerUpload')?.click()}
                        aria-label="Modifier la bannière"
                    >
                        {!isLoading && (
                            <>
                                <CiCamera size={24} className="mr-2" aria-hidden="true"/>
                                Changer la bannière
                            </>
                        )}
                    </Button>

                    <input
                        type="file"
                        id="bannerUpload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                    />
                </div>
            </div>

            <p className="text-sm text-gray-500 font-light">
                Formats supportés : JPEG, PNG, WEBP (Max. 5Mo)
            </p>

            {uploadState && (
                <div
                    className={`flex items-center gap-2 text-sm ${
                        uploadState.status === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                    }`}
                >
                    {uploadState.status === 'success' ? (
                        <CiCircleCheck size={20} aria-hidden="true"/>
                    ) : (
                        <CiCircleAlert size={20} aria-hidden="true"/>
                    )}
                    <span className="truncate">{uploadState.message}</span>
                </div>
            )}
        </div>
    );
};