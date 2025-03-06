import CryptoJS from 'crypto-js';

export const encrypt = (data) => {
    return CryptoJS.AES
        .encrypt(data,
            process.env.LDAP_ENCRYPTION_KEY,
            {salt: process.env.LDAP_SALT}
        ).toString();
};

export const decrypt = (ciphertext) => {
    const bytes = CryptoJS.AES.decrypt(
        ciphertext,
        process.env.LDAP_ENCRYPTION_KEY,
        {salt: process.env.LDAP_SALT}
    );
    return bytes.toString(CryptoJS.enc.Utf8);
};