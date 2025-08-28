import {useState} from 'react';
import {CiCamera, CiCircleAlert, CiCircleCheck} from 'react-icons/ci';
import {Button} from '@heroui/button';
import {addToast} from "@heroui/toast";
import Image from 'next/image';
import nextConfig from '../next.config.mjs';

const basePath = nextConfig.basePath || '';

export const General = () => {
    const [uploadState, setUploadState] = useState(null);
    const [isLoading, setIsLoading] = useState(false);


    const handleBannerUpload = async (file) => {
        if (!file) return;

        // Validation côté client
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 2 * 1024 * 1024; // 2MB

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
                message: 'Fichier trop volumineux (max 2Mo)'
            });
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('banner', file);

        try {
            const response = await fetch('/api/upload-banner', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur de téléchargement');
            }

            const data = await response.json();
            setUploadState(data);
            document.getElementById('bannerUpload').value = '';

            addToast({
                title: 'Téléchargement réussi',
                description: 'La bannière a été mise à jour avec succès',
                color: 'success',
                duration: 2000,
            });
        } catch (error) {
            setUploadState({
                status: 'error',
                message: error.message
            });
            addToast({
                title: 'Erreur de téléchargement',
                description: error.message || 'Une erreur est survenue lors du téléchargement',
                color: 'danger',
                duration: 2000,
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setUploadState(null), 2000);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-neutral-900 bg-opacity-100 h-full overflow-y-auto">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-black dark:text-neutral-200">Bannière du profil</h3>
                    <Button
                        variant="flat"
                        color="default"
                        size="sm"
                        isLoading={isLoading}
                        onPress={() => document.getElementById('bannerUpload')?.click()}
                        startContent={!isLoading && <CiCamera size={20}/>}
                    >
                        Changer la bannière
                    </Button>
                    <input
                        type="file"
                        id="bannerUpload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleBannerUpload(e.target.files?.[0])}
                    />
                </div>

                <div className="rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Image
                        src={`${basePath}/banner.png`}
                        width={1200}
                        height={720}
                        alt="Bannière actuelle"
                        className="object-cover w-full"
                        priority
                        quality={100}
                        style={{
                            width: '100%',
                            height: '250px',
                            objectFit: 'cover'
                        }}
                    />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Formats supportés : JPEG, PNG, WEBP (Max. 2Mo)
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
        </div>
    );
};