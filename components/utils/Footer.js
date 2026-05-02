'use client';

import React, {useEffect, useState} from "react";
import {usePathname} from "next/navigation";

// Récupérer la version depuis différentes sources
const getVersion = () => {
    // Version depuis package.json
    try {
        // Import dynamique du package.json
        const packageJson = require('../../package.json');
        return packageJson.version;
    } catch (error) {
        // Fallback si l'import échoue
        return '1.0.0';
    }
};

export default function Footer() {
    const pathname = usePathname();
    const version = getVersion();
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [showFooter, setShowFooter] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/app-settings`);
                if (!response.ok) return;
                const settings = await response.json();
                setShowFooter(settings.showFooter !== false);
            } catch (error) {
                setShowFooter(true);
            } finally {
                setSettingsLoaded(true);
            }
        };

        loadSettings();
    }, []);

    if (pathname?.startsWith('/admin')) return null;
    if (!settingsLoaded) return null;
    if (!showFooter) return null;

    return (
        <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
            <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-4 lg:px-8">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                    {/* Copyright */}
                    <div className="flex justify-center sm:justify-start">
                        <span
                            className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500 text-center sm:text-right">
                            © 2026 Spotly v{version} - Logiciel libre sous licence GNU GPL
                        </span>
                    </div>
                    {/* Logos sociaux centrés */}
                    <div className="flex justify-center space-x-4">
                        <a
                            href="https://github.com/lowouis/spotly"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200"
                            aria-label="GitHub du projet Spotly"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </a>
                        <a
                            href="https://www.youtube.com/@ServiceSpotly"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200"
                            aria-label="Chaîne YouTube ServiceSpotly"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </a>
                    </div>


                </div>
            </div>
        </footer>
    );
}
