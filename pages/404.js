
import Link from "next/link";


function Custom404() {
    return (
        <div className="bg-white min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
            <div className="max-w-max mx-auto">
                <main className="sm:flex">
                    <div className="slg:block lg:w-32 relative">
                        <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"
                             fill="#000000">
                            <path
                                d="M180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Zm0-490h600v-130H180v130Zm0 0v-130 130Zm300 230q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"/>
                        </svg>
                    </div>
                    <div className="lg:ml-6">
                        <div className="lg:border-l sm:border-gray-200 lg:pl-6">
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                                Cette page n'existe pas
                            </h1>
                            <p className="mt-4 text-base text-gray-500">
                                Si vous avez tapé l'URL manuellement, veuillez vérifier l'orthographe et réessayer.
                            </p>
                        </div>
                        <div className="mt-10 flex space-x-3 lg:border-l lg:border-transparent lg:pl-6">
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Retourner à l'accueil
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

Custom404.title = "Page introuvable";

export default Custom404;