const TEST_AUTH_ENABLED = process.env.ENABLE_TEST_AUTH_SERVICES === 'true' && process.env.NODE_ENV !== 'production';

const TEST_USERS = {
    admin: {
        cn: 'admin',
        givenName: 'Admin',
        sAMAccountName: 'admin',
        mail: 'admin@spotly.fr',
        sn: 'Spotly',
        memberOf: ['CN=Spotly Admins,OU=Groups,DC=spotly,DC=test'],
    },
    'sso.e2e': {
        cn: 'sso.e2e',
        givenName: 'SSO',
        sAMAccountName: 'sso.e2e',
        mail: 'sso.e2e@spotly.test',
        sn: 'E2E',
        memberOf: ['CN=Spotly Users,OU=Groups,DC=spotly,DC=test'],
    },
};

export function isTestAuthServiceEnabled() {
    return TEST_AUTH_ENABLED;
}

export function isMockLdapConfig(config = {}) {
    return isTestAuthServiceEnabled() || config.serverUrl?.startsWith('mock://') || config.url?.startsWith('mock://');
}

export function testLdapConnection(config = {}) {
    const username = config.username || config.adminCn || 'admin';

    if (!TEST_USERS[username]) {
        return {
            success: false,
            error: `Utilisateur LDAP de test introuvable: ${username}`,
        };
    }

    return {success: true};
}

export function findTestLdapUser(username) {
    const user = TEST_USERS[username];

    if (!user) {
        return {
            success: false,
            error: `Utilisateur LDAP de test introuvable: ${username}`,
        };
    }

    return {success: true, user};
}

export function isMockKerberosConfig(config = {}) {
    return isTestAuthServiceEnabled() || config.serviceHost === 'mock.spotly.test' || config.realm === 'SPOTLY.TEST';
}

export function getTestSsoTicket(username = 'admin') {
    return `test-ticket:${username}@SPOTLY.TEST`;
}

export function validateTestKerberosTicket(ticket) {
    if (!ticket?.startsWith('test-ticket:')) {
        return {
            success: false,
            error: 'Ticket Kerberos de test invalide',
        };
    }

    return {
        success: true,
        username: ticket.replace('test-ticket:', ''),
    };
}
