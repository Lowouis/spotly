# Docker Values

Référence des valeurs utiles pour lancer Spotly en local avec `docker-compose.yml` et renseigner les modules LDAP, SMTP et SSO depuis l’interface admin.

## Base

Services Docker fournis :

| Service | URL / host | Identifiants |
| --- | --- | --- |
| MySQL | `localhost:3306` | DB `spotly`, user `spotly`, password `spotly`, root `root` |
| LDAP | `ldap://localhost:389` depuis l’hôte, `ldap://ldap:389` entre conteneurs | admin `cn=admin,dc=dev,dc=local`, password `admin` |
| phpLDAPadmin | `http://localhost:8081` | login `cn=admin,dc=dev,dc=local`, password `admin` |
| Keycloak | `http://localhost:8080` | admin `admin`, password `admin` |

Variables `.env.local` minimales :

```env
NEXTAUTH_URL=http://localhost:3001
NEXT_PUBLIC_API_ENDPOINT=http://localhost:3001
NEXT_PUBLIC_API_DOMAIN=localhost
NEXT_PUBLIC_BASE_PATH=

DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://spotly:spotly@localhost:3306/spotly

AUTH_SECRET=CHANGE_ME_LOCAL_AUTH_SECRET
LDAP_ENCRYPTION_KEY=CHANGE_ME_LOCAL_LDAP_ENCRYPTION_KEY

ENABLE_TEST_AUTH_SERVICES=true
NEXT_PUBLIC_EMAIL_USER=admin@admin.fr
CRON_SECRET=CHANGE_ME_LOCAL_CRON_SECRET
```

## LDAP

Configuration à saisir dans `Admin > Liaisons > LDAP` :

| Champ UI | Valeur Docker locale |
| --- | --- |
| URL du serveur LDAP | `ldap://localhost:389` |
| Bind DN | `dc=dev,dc=local` |
| CN administrateur | `admin` |
| DN administrateur | `cn=admin,dc=dev,dc=local` |
| Mot de passe administrateur | `admin` |
| Domaine e-mail | `dev.local` |

Notes :

- La configuration effective est stockée en base dans `LdapConfig`.
- Les valeurs sensibles sont chiffrées avec `LDAP_ENCRYPTION_KEY`; ne changez pas cette clé après avoir enregistré une config sans prévoir de réenregistrement.
- Depuis un conteneur applicatif sur le même réseau Docker, utiliser plutôt `ldap://ldap:389`.

## SMTP

Spotly ne déclare pas de serveur SMTP dans `docker-compose.yml`. Pour un test local simple, ajouter un serveur type Mailpit/MailHog ou utiliser un SMTP existant.

Exemple avec Mailpit à ajouter au compose si besoin :

```yaml
mailpit:
  image: axllent/mailpit:latest
  container_name: spotly-mailpit
  restart: unless-stopped
  ports:
    - "1025:1025"
    - "8025:8025"
```

Configuration à saisir dans `Admin > Liaisons > SMTP` avec Mailpit :

| Champ UI | Valeur locale |
| --- | --- |
| Serveur SMTP | `localhost` |
| Port | `1025` |
| Nom d’utilisateur | `spotly` |
| Mot de passe | `spotly` |
| Email d’expédition | `spotly@dev.local` |
| Nom d’expédition | `Spotly` |
| Connexion sécurisée TLS/SSL | désactivé |

Notes :

- La configuration effective est stockée en base dans `SmtpConfig`.
- Le mot de passe, le port, l’utilisateur et les champs d’expédition sont stockés chiffrés.
- L’interface Mailpit serait disponible sur `http://localhost:8025`.
- Si l’application tourne dans Docker, utiliser `mailpit` comme host SMTP au lieu de `localhost`.

## SSO / Kerberos

Le `docker-compose.yml` fournit Keycloak mais pas de serveur Kerberos/KDC prêt à l’emploi. Le module SSO de Spotly attend une configuration Kerberos enregistrée en base dans `KerberosConfig`.

Configuration à saisir dans `Admin > Liaisons > SSO` pour un environnement Kerberos réel :

| Champ UI | Exemple |
| --- | --- |
| Realm Kerberos | `DEV.LOCAL` |
| Serveur KDC | `kdc.dev.local:88` |
| Serveur Admin | `kdc.dev.local:749` |
| Domaine par défaut | `dev.local` |
| Nom d’hôte du service HTTP | `spotly.dev.local` |
| Chemin du fichier keytab | `/etc/krb5.keytab` |
| Activer le SSO Kerberos | activé |

Références utiles :

```env
# Optionnel, documentation uniquement: la config effective est en base.
KERBEROS_REALM=DEV.LOCAL
KERBEROS_SERVICE_NAME=HTTP
KERBEROS_KEYTAB_PATH=/etc/krb5.keytab
KERBEROS_PRINCIPAL=HTTP/spotly.dev.local@DEV.LOCAL
```

Notes :

- Le fichier keytab doit exister dans l’environnement où tourne l’application Next.js.
- Le principal attendu suit généralement `HTTP/<serviceHost>@<REALM>`.
- `ENABLE_TEST_AUTH_SERVICES=true` active les services de test/développement, mais ne remplace pas une vraie configuration Kerberos.

## Commandes Locales

```bash
docker compose up -d mysql ldap phpldapadmin keycloak
npm install
npx prisma db push
npm run seed
npm run dev
```

Si vous ajoutez Mailpit :

```bash
docker compose up -d mailpit
```
