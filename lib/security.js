import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({path: '.env.local'});

export const encrypt = (data) => {
    console.log("Chiffrement des données sensibles");
    if (!data) return '';
    if (!process.env.LDAP_ENCRYPTION_KEY) {
        throw new Error('La variable d\'environnement LDAP_ENCRYPTION_KEY est requise');
    }
    return CryptoJS.AES.encrypt(data, process.env.LDAP_ENCRYPTION_KEY).toString();
};

export const decrypt = (ciphertext) => {
    if (!ciphertext) return '';
    if (!process.env.LDAP_ENCRYPTION_KEY) {
        throw new Error('La variable d\'environnement LDAP_ENCRYPTION_KEY est requise');
    }
    const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.LDAP_ENCRYPTION_KEY);
   return bytes.toString(CryptoJS.enc.Utf8);

};