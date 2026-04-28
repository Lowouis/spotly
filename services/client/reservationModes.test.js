import {
    canConfirmWithCode,
    getAutomaticReservationPhase,
    getEffectivePickableName,
    getPickupControlMode,
    getReturnControlMode,
    requiresPickupCode,
    requiresReturnCode,
    RESERVATION_CONTROL_MODE,
} from './reservationModes';

function entryWithPickable(name, level = 'resource') {
    const pickable = {name};
    return {
        returnedConfirmationCode: '123456',
        resource: {
            pickable: level === 'resource' ? pickable : null,
            category: {pickable: level === 'category' ? pickable : null},
            domains: {pickable: level === 'domain' ? pickable : null},
        },
    };
}

describe('reservation control modes', () => {
    it('resolves pickable inheritance from resource, category, then domain', () => {
        expect(getEffectivePickableName(entryWithPickable('DIGIT', 'resource'))).toBe('DIGIT');
        expect(getEffectivePickableName(entryWithPickable('LOW_TRUST', 'category'))).toBe('LOW_TRUST');
        expect(getEffectivePickableName(entryWithPickable('FLUENT', 'domain'))).toBe('FLUENT');
    });

    it('treats FLUENT as automatic pickup and return', () => {
        const entry = entryWithPickable('FLUENT');

        expect(getPickupControlMode(entry)).toBe(RESERVATION_CONTROL_MODE.AUTOMATIC);
        expect(getReturnControlMode(entry)).toBe(RESERVATION_CONTROL_MODE.AUTOMATIC);
        expect(requiresPickupCode(entry)).toBe(false);
        expect(requiresReturnCode(entry)).toBe(false);
    });

    it('derives automatic reservation phase from dates', () => {
        const entry = {
            ...entryWithPickable('FLUENT'),
            moderate: 'ACCEPTED',
            startDate: '2026-04-28T20:00:00.000Z',
            endDate: '2026-04-29T21:00:00.000Z',
        };

        expect(getAutomaticReservationPhase(entry, new Date('2026-04-28T19:59:00.000Z'))).toBe(null);
        expect(getAutomaticReservationPhase(entry, new Date('2026-04-28T20:00:00.000Z'))).toBe('ongoing');
        expect(getAutomaticReservationPhase(entry, new Date('2026-04-29T21:00:00.000Z'))).toBe('ended');
    });

    it('treats LOW_TRUST as click pickup and click return', () => {
        const entry = entryWithPickable('LOW_TRUST');

        expect(getPickupControlMode(entry)).toBe(RESERVATION_CONTROL_MODE.CLICK);
        expect(getReturnControlMode(entry)).toBe(RESERVATION_CONTROL_MODE.CLICK);
    });

    it('treats DIGIT and HIGH_AUTH as code-protected pickup and return', () => {
        for (const name of ['DIGIT', 'HIGH_AUTH']) {
            const entry = entryWithPickable(name);

            expect(getPickupControlMode(entry)).toBe(RESERVATION_CONTROL_MODE.CODE);
            expect(getReturnControlMode(entry)).toBe(RESERVATION_CONTROL_MODE.CODE);
            expect(requiresPickupCode(entry)).toBe(true);
            expect(requiresReturnCode(entry)).toBe(true);
        }
    });

    it('validates confirmation codes before code-based state changes', () => {
        const entry = entryWithPickable('DIGIT');

        expect(canConfirmWithCode(entry, '123456')).toBe(true);
        expect(canConfirmWithCode(entry, '000000')).toBe(false);
        expect(canConfirmWithCode(entry, '')).toBe(false);
    });
});
