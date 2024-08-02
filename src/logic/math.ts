/**
 * Remaps a value from one range to another range.
 * @param value - The value to remap.
 * @param start1 - The start of the original range.
 * @param end1 - The end of the original range.
 * @param start2 - The start of the target range.
 * @param end2 - The end of the target range.
 * @returns The remapped value in the target range.
 */
export function remap(value: number, start1: number, end1: number, start2: number, end2: number): number {
	// Ensure the original range is not zero to avoid division by zero.
	if (start1 === end1) {
		throw new Error("Original range cannot be zero.");
	}

	// Calculate the remapped value.
	return start2 + ((value - start1) / (end1 - start1)) * (end2 - start2);
}