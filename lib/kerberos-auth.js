import kerberos from 'kerberos';

export async function validateKerberosTicket(ticket) {
    try {
        const service = await kerberos.initializeServer('HTTP');
        const result = await service.step(ticket);

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