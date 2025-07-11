import nodemailer from 'nodemailer';

export async function validateSmtpConfig(config) {
    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: config.secure ?? true,

            tls: {
                rejectUnauthorized: false,
            },

            auth : {
                user : config.username,
                pass : config.password
            }
        });

        // Tenter de vérifier la connexion
        await transporter.verify();

        // Si verify réussit, la configuration est valide
        return { success: true };

    } catch (error) {
        // Si verify échoue, la configuration est invalide
        console.error("SMTP validation error:", error);
        return {
            success: false,
            error: `Erreur lors du test de connexion SMTP: ${error.message}`
        };
    }
}