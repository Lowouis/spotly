import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const ldifPath = path.join(projectRoot, 'docker/ldap/users.ldif');
const containerName = process.env.LDAP_CONTAINER || 'dev-ldap';

function dockerExec(args, options = {}) {
    return execFileSync('docker', ['exec', ...args], {
        stdio: options.stdio || 'pipe',
        encoding: 'utf8',
    });
}

function dockerCp(source, target) {
    execFileSync('docker', ['cp', source, target], {stdio: 'inherit'});
}

try {
    dockerExec([containerName, 'ldapsearch', '-x', '-H', 'ldap://localhost:389', '-D', 'cn=admin,dc=dev,dc=local', '-w', 'admin', '-b', 'dc=dev,dc=local', 'uid=alice']);
} catch {
    console.error(`Le conteneur LDAP "${containerName}" n'est pas prêt. Lance d'abord: docker compose up -d ldap`);
    process.exit(1);
}

dockerCp(ldifPath, `${containerName}:/tmp/users.ldif`);

try {
    dockerExec([
        containerName,
        'ldapadd',
        '-x',
        '-H', 'ldap://localhost:389',
        '-D', 'cn=admin,dc=dev,dc=local',
        '-w', 'admin',
        '-f', '/tmp/users.ldif',
        '-c',
    ], {stdio: 'inherit'});
} catch {
    // ldapadd -c exits non-zero when entries already exist. Verify below instead of failing.
}

const result = dockerExec([
    containerName,
    'ldapsearch',
    '-x',
    '-H', 'ldap://localhost:389',
    '-D', 'cn=admin,dc=dev,dc=local',
    '-w', 'admin',
    '-b', 'dc=dev,dc=local',
    '(objectClass=inetOrgPerson)',
    'uid',
    'mail',
]);

console.log(result);
console.log('Utilisateurs LDAP de développement prêts. Mot de passe pour tous: password');
