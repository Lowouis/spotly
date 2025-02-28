import React, { useState } from 'react'
import {
    FiGrid,
    FiFolder,
    FiFileText,
    FiSettings,
    FiUser,
    FiLayers,
    FiPlusSquare,
} from 'react-icons/fi'

export default function Sidebor() {
    // État local pour savoir si la sidebar est ouverte ou fermée
    const [isOpen, setIsOpen] = useState(true)

    // Fonction pour toggler l'ouverture/fermeture
    const toggleSidebar = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div
            className={`
        flex flex-col h-screen bg-white border-r border-gray-200
        transition-all duration-300
        ${isOpen ? 'w-64' : 'w-20'}
      `}
        >
            {/* Header de la sidebar */}
            <div className="flex items-center justify-between px-4 py-3">
        <span
            className={`
            text-lg font-semibold text-gray-900
            whitespace-nowrap
            transition-opacity duration-300
            ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
          `}
        >
          Untitled UI
        </span>

                {/* Bouton pour toggler */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-gray-500 rounded-md hover:bg-gray-200"
                >
                    <FiSettings size={18} />
                </button>
            </div>

            {/* Liens de navigation */}
            <nav className="flex-1 mt-4">
                {/* DASHBOARD */}
                <h2
                    className={`
            px-4 text-xs font-semibold text-gray-400 uppercase
            transition-all duration-300
            ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
          `}
                >
                    Dashboard
                </h2>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiGrid className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Overview
          </span>
                </a>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiFolder className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Current projects
          </span>
                    {isOpen && (
                        <span className="ml-auto text-sm text-gray-500">10</span>
                    )}
                </a>

                {/* EDITOR */}
                <h2
                    className={`
            px-4 mt-4 text-xs font-semibold text-gray-400 uppercase
            transition-all duration-300
            ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
          `}
                >
                    Editor
                </h2>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiUser className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Designer
          </span>
                </a>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiLayers className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Magic build
          </span>
                </a>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiFileText className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Color system
          </span>
                </a>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiFolder className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Current projects
          </span>
                </a>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiPlusSquare className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Upload new
          </span>
                </a>

                {/* REPORTS */}
                <h2
                    className={`
            px-4 mt-4 text-xs font-semibold text-gray-400 uppercase
            transition-all duration-300
            ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
          `}
                >
                    Reports
                </h2>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiGrid className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Overview
          </span>
                </a>

                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiFolder className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Scheduled reports
          </span>
                </a>
            </nav>

            {/* Footer de la sidebar (paramètres et profil) */}
            <div className="p-4 border-t border-gray-200">
                <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                    <FiSettings className="mr-3" />
                    <span
                        className={`
              transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
            Settings
          </span>
                </a>

                <div className="flex items-center mt-4">
                    <img
                        src="https://via.placeholder.com/40"
                        alt="User avatar"
                        className="w-10 h-10 rounded-full"
                    />
                    <div
                        className={`
              ml-2 transition-opacity duration-300
              ${!isOpen ? 'opacity-0 pointer-events-none' : ''}
            `}
                    >
                        <p className="text-sm font-medium text-gray-900">
                            Frankie Sullivan
                        </p>
                        <p className="text-sm text-gray-500">frankie@untitledui.com</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
