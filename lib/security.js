import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({path: '.env.local'});

export const encrypt = (data) => {
    if (!data) return '';
    if (!process.env.LDAP_ENCRYPTION_KEY || !process.env.LDAP_SALT) {
        throw new Error('Les variables d\'environnement LDAP_ENCRYPTION_KEY et LDAP_SALT sont requises');
    }
    return CryptoJS.AES
        .encrypt(data,
            process.env.LDAP_ENCRYPTION_KEY,
            {salt: process.env.LDAP_SALT}
        ).toString();
};

export const decrypt = (ciphertext) => {
    if (!ciphertext) return '';
    if (!process.env.LDAP_ENCRYPTION_KEY || !process.env.LDAP_SALT) {
        throw new Error('Les variables d\'environnement LDAP_ENCRYPTION_KEY et LDAP_SALT sont requises');
    }
    const bytes = CryptoJS.AES.decrypt(
        ciphertext,
        process.env.LDAP_ENCRYPTION_KEY,
        {salt: process.env.LDAP_SALT}
    );
    return bytes.toString(CryptoJS.enc.Utf8);
};