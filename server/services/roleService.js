import {role} from '@prisma/client';

export function listRoles() {
    return Object.values(role).map((roleName, index) => ({id: index + 1, name: roleName}));
}
