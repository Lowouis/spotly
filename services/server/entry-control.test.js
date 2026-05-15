import {isAutomaticControl, isAutomaticPickupControl, isAutomaticReturnControl, requiresLocationCheck, canUseExternalCode} from './entry-control';

function entryWithPickable(name, level = 'resource') {
    const pickable = {name};
    return {
        resource: {
            pickable: level === 'resource' ? pickable : null,
            category: {pickable: level === 'category' ? pickable : null},
            domains: {pickable: level === 'domain' ? pickable : null},
        },
    };
}

describe('server entry control', () => {
    it('detects FLUENT as automatic control through inheritance', () => {
        expect(isAutomaticControl(entryWithPickable('FLUENT'))).toBe(true);
        expect(isAutomaticControl(entryWithPickable('FLUENT', 'category'))).toBe(true);
        expect(isAutomaticControl(entryWithPickable('LOW_TRUST'))).toBe(false);
    });

    it('distinguishes automatic pickup from automatic return', () => {
        expect(isAutomaticPickupControl(entryWithPickable('FLUENT'))).toBe(true);
        expect(isAutomaticReturnControl(entryWithPickable('FLUENT'))).toBe(true);
        expect(isAutomaticPickupControl(entryWithPickable('HIGH_TRUST'))).toBe(true);
        expect(isAutomaticReturnControl(entryWithPickable('HIGH_TRUST'))).toBe(false);
        expect(isAutomaticPickupControl(entryWithPickable('LOW_TRUST'))).toBe(false);
    });

    it('keeps location and external-code rules separate from FLUENT', () => {
        expect(requiresLocationCheck(entryWithPickable('HIGH_AUTH'))).toBe(true);
        expect(canUseExternalCode(entryWithPickable('HIGH_AUTH'))).toBe(true);
        expect(canUseExternalCode(entryWithPickable('FLUENT'))).toBe(false);
    });
});
