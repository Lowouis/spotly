'use client';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center space-y-8 px-4">
                {/* Numéro 404 */}
                <div className="space-y-4">
                    <h1 className="text-8xl sm:text-9xl font-bold text-neutral-200 dark:text-neutral-700">
                        404
                    </h1>
                    <div className="w-24 h-1 bg-neutral-300 dark:bg-neutral-600 mx-auto rounded-full"></div>
                </div>

                {/* Message */}
                <div className="space-y-4 max-w-md mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                        Page introuvable
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                        La page que vous recherchez n&apos;existe pas ou a été déplacée.
                    </p>
                </div>

                {/* Bouton retour accueil */}
                <div className="pt-4">
                    <a
                        href={process.env.NEXT_PUBLIC_BASE_PATH || '/'}
                        className="text-default-500 dark:text-neutral-400 font-medium hover:underline dark:hover:text-neutral-500"
                        aria-label="Retour à l&apos;accueil"
                    >
                        Retour à l&apos;accueil
                    </a>
                </div>
            </div>
        </div>
    );
}
