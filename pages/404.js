
import Link from "next/link";
import {Card, CardBody, CardFooter, CardHeader, Divider} from "@nextui-org/react";
import {Button} from "@nextui-org/button";


function Custom404() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">404</h1>
                <p className="text-xl mt-4 text-gray-600">Il semblerait que cette page n'existe pas.</p>

                <div className="mt-8">
                    <Link href="/" passHref>
                        <Button auto size="large" shadow color="primary">
                            Retour à l'accueil
                        </Button>
                    </Link>
                </div>
            </div>

        </div>
    );
}

Custom404.title = "Page introuvable";

export default Custom404;