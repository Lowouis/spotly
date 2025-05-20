import fetch from 'node-fetch';

const baseUrl = process.env.PUBLIC_API_ENDPOINT || 'http://localhost:3000';

const testRoutes = async () => {
    const routes = [
        '/api/entry?userId=1',
        '/api/resources',
        '/api/domains',
        '/api/categories'
    ];

    for (const route of routes) {
        console.log(`\n🔍 Test de la route: ${route}`);
        try {
            const response = await fetch(`${baseUrl}${route}`, {
                method: 'GET',
                headers: {
                    'Origin': baseUrl
                }
            });

            console.log('📥 Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (response.ok) {
                const data = await response.json();
                //console.log('✅ Données reçues:', data);
            } else {
                console.log('❌ Erreur:', response.statusText);
            }
        } catch (error) {
            console.log('❌ Erreur de requête:', error.message);
        }
    }
};

testRoutes(); 