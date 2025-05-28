module.exports = {
    apps: [
        {
            name: 'spotly-app',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                KRB5_KTNAME: '/etc/apache2/fhm.keytab'
            }
        },
        {
            name: 'spotly-cron',
            script: './utils/cron.mjs',
            env: {
                NODE_ENV: 'production'
            },
            autorestart: true,
            watch: false
        }
    ]
};