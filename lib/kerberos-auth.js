import kerberos from 'kerberos';
import {decrypt} from "@/lib/security";

let kerberosService;

export async function initializeKerberos(config) {
    if (!config) throw new Error("Configuration Kerberos non fournie.");

    const servicePrincipal = `HTTP@${decrypt(config.serviceHost)}`;
    console.log(`Initialisation du service Kerberos pour le principal : ${servicePrincipal}`);
    kerberosService = await kerberos.initializeServer(servicePrincipal);
    return kerberosService;
}

export async function validateKerberosTicket(ticket) {
    if (!kerberosService) {
        console.error("Le service Kerberos n'a pas été initialisé. Assurez-vous d'appeler initializeKerberos en premier.");
        // Fallback vers une initialisation de base si le service n'est pas prêt.
        // Cela peut se produire si un autre flux d'authentification est utilisé.
        console.log("Tentative d'initialisation Kerberos avec le principal HTTP par défaut.");
        kerberosService = await kerberos.initializeServer('HTTP');
    }

    try {
        const result = await kerberosService.step(ticket);

        if (result) {
            // Le ticket est valide
            return {
                success: true,
                username: result.username
            };
        }
        return {
            success: false,
            error: 'Invalid ticket'
        };
    } catch (error) {
        console.error('Kerberos validation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
} 