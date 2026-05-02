export function getEffectivePickable(entry) {
    return entry?.resource?.pickable || entry?.resource?.category?.pickable || entry?.resource?.domains?.pickable || null;
}

export function requiresLocationCheck(entry) {
    return getEffectivePickable(entry)?.name === 'HIGH_AUTH';
}

export function canUseExternalCode(entry) {
    return ['LOW_AUTH', 'HIGH_AUTH'].includes(getEffectivePickable(entry)?.name);
}
