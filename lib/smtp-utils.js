export async function validateSmtpConfig(config) {
    try {
        // Vérifier que le host est valide
        if (!config.host.match(/^[a-zA-Z0-9.-]+$/)) {
            return {
                success: false,
                error: 'Le nom d\'hôte doit être un nom de domaine valide'
            };
        }

        // Vérifier que le port est valide
        const port = parseInt(config.port);
        if (isNaN(port) || port < 1 || port > 65535) {
            return {
                success: false,
                error: 'Le port doit être un nombre entre 1 et 65535'
            };
        }

        // Vérifier que le nom d'utilisateur est valide
        if (!config.username.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            return {
                success: false,
                error: 'Le nom d\'utilisateur doit être une adresse email valide'
            };
        }

        // Vérifier que l'email d'expédition est valide
        if (!config.fromEmail.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            return {
                success: false,
                error: 'L\'email d\'expédition doit être une adresse email valide'
            };
        }

        // Vérifier que le nom d'expédition n'est pas vide
        if (!config.fromName.trim()) {
            return {
                success: false,
                error: 'Le nom d\'expédition ne peut pas être vide'
            };
        }

        return {success: true};

    } catch (error) {
        return {
            success: false,
            error: `Erreur lors de la validation de la configuration: ${error.message}`
        };
    }
} 