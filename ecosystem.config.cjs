module.exports = {
    apps: [
        {
            name: 'spotly',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                KRB5_KTNAME: '/etc/apache2/fhm.keytab',
            },
            autorestart: true,
        }
    ]
};
