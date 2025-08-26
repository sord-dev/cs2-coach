// Area-specific insight and recommendation helpers for LeetifyDataTransformer
import { areaTargets } from '../utils.js';

/**
 * Returns the list of area names for which insights can be generated.
 */
export function getInsightAreas(): string[] {
	return Object.keys(areaTargets);
}

/**
 * Returns the area target config for a given area name.
 */
export function getAreaTarget(area: string) {
	return areaTargets[area];
}

/**
 * Returns a human-friendly label for an area.
 */
export function getAreaLabel(area: string): string {
	switch (area) {
		case 'aim': return 'Aiming';
		case 'utility': return 'Utility Usage';
		case 'trading': return 'Trading';
		case 'clutch': return 'Clutch';
		case 'opening': return 'Opening Duels';
		case 'support': return 'Support';
		default: return area.charAt(0).toUpperCase() + area.slice(1);
	}
}