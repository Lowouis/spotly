export const RESERVATION_CONTROL_MODE = {
    AUTOMATIC: 'automatic',
    CLICK: 'click',
    CODE: 'code',
};

export function getEffectivePickable(entry) {
    return entry?.resource?.pickable || entry?.resource?.category?.pickable || entry?.resource?.domains?.pickable || null;
}

export function getEffectivePickableName(entry) {
    return getEffectivePickable(entry)?.name || null;
}

export function getPickupControlMode(entry) {
    switch (getEffectivePickableName(entry)) {
        case 'FLUENT':
            return RESERVATION_CONTROL_MODE.AUTOMATIC;
        case 'DIGIT':
        case 'LOW_AUTH':
        case 'HIGH_AUTH':
            return RESERVATION_CONTROL_MODE.CODE;
        case 'LOW_TRUST':
        case 'HIGH_TRUST':
        default:
            return RESERVATION_CONTROL_MODE.CLICK;
    }
}

export function getReturnControlMode(entry) {
    switch (getEffectivePickableName(entry)) {
        case 'FLUENT':
            return RESERVATION_CONTROL_MODE.AUTOMATIC;
        case 'DIGIT':
        case 'LOW_AUTH':
        case 'HIGH_AUTH':
            return RESERVATION_CONTROL_MODE.CODE;
        case 'LOW_TRUST':
        case 'HIGH_TRUST':
        default:
            return RESERVATION_CONTROL_MODE.CLICK;
    }
}

export function requiresPickupCode(entry) {
    return getPickupControlMode(entry) === RESERVATION_CONTROL_MODE.CODE;
}

export function requiresReturnCode(entry) {
    return getReturnControlMode(entry) === RESERVATION_CONTROL_MODE.CODE;
}

export function canConfirmWithCode(entry, code) {
    return Boolean(code && entry?.returnedConfirmationCode && code === entry.returnedConfirmationCode);
}

export function getAutomaticReservationPhase(entry, now = new Date()) {
    if (getPickupControlMode(entry) !== RESERVATION_CONTROL_MODE.AUTOMATIC || entry?.moderate !== 'ACCEPTED') {
        return null;
    }

    const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const startTime = new Date(entry.startDate).getTime();
    const endTime = new Date(entry.endDate).getTime();

    if (currentTime >= endTime) return 'ended';
    if (currentTime >= startTime) return 'ongoing';
    return null;
}
