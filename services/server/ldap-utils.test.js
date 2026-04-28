import {TextDecoder, TextEncoder} from 'util';

global.TextEncoder ||= TextEncoder;
global.TextDecoder ||= TextDecoder;

describe('LDAP user import helpers', () => {
    let normalizeLdapUser;

    beforeAll(async () => {
        ({normalizeLdapUser} = await import('./ldap-utils'));
    });

    it('normalizes inetOrgPerson users for local import', () => {
        expect(normalizeLdapUser({
            uid: 'nadia',
            givenName: 'Nadia',
            sn: 'Robert',
            cn: 'Nadia Robert',
            mail: 'nadia@dev.local',
        })).toEqual({
            username: 'nadia',
            email: 'nadia@dev.local',
            name: 'Nadia',
            surname: 'Robert',
            external: true,
            password: null,
            role: 'USER',
        });
    });

    it('falls back to cn when uid and sAMAccountName are missing', () => {
        expect(normalizeLdapUser({cn: 'Alice Martin'})).toMatchObject({
            username: 'Alice Martin',
            name: 'Alice',
            surname: 'Martin',
        });
    });
});
