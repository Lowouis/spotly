export function sanitizeUser(user) {
    if (!user) return null;

    const {password, ...safeUser} = user;
    return safeUser;
}
