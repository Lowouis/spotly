import kerberos from 'kerberos';
import {decrypt} from "@/lib/security";

let kerberosService;

export async function initializeKerberos(config) {
    if (!config) throw new Error("Configuration Kerberos non fournie.");

    const servicePrincipal = `HTTP@${decrypt(config.serviceHost)}`;
    kerberosService = await kerberos.initializeServer(servicePrincipal);
    return kerberosService;
}

export async function validateKerberosTicket(ticket) {
    if (!kerberosService) {
        console.error("Le service Kerberos n'a pas été initialisé. Assurez-vous d'appeler initializeKerberos en premier.");
        // Fallback vers une initialisation de base si le service n'est pas prêt.
        // Cela peut se produire si un autre flux d'authentification est utilisé.
        kerberosService = await kerberos.initializeServer('HTTP');
    }

    try {
        const serverResponse = await kerberosService.step(ticket);

        // Le serveur nous a donné une réponse à renvoyer au client.
        // Maintenant, le client devrait nous renvoyer une requête authentifiée.
        // Dans le contexte de l'API, nous pouvons supposer que la prochaine étape contient le contexte utilisateur.
        if (kerberosService.username) {
            return {
                success: true,
                username: kerberosService.username
            };
        }
        
        console.error("Kerberos-auth: Échec de la validation, le username n'est pas disponible après l'étape 1.");
        return {
            success: false,
            error: 'Invalid ticket or context'
        };
    } catch (error) {
        console.error('Kerberos-auth: Erreur majeure lors de la validation:', error);
        return {
            success: false,
            error: error.message
        };
    }
} 