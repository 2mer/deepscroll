import { Point2D } from "./Point2d";

export default class SpatialHash<T> {

	hash = new Map<string, T[]>();

	constructor(public gridSize: number, private transform: (v: T) => Point2D) {
	}

	gridPosToKey(pos: Point2D) {
		return pos.floor().hash()
	}

	posToGridPos(pos: Point2D) {
		return pos.div(this.gridSize).floor();
	}

	posToKey(pos: Point2D) {
		return this.posToGridPos(pos).hash()
	}

	key(data: T) {
		return this.posToKey(this.transform(data));
	}

	add(data: T) {
		const key = this.key(data);

		const items = this.hash.get(key) ?? [];
		items.push(data);
		this.hash.set(key, items);
	}

	at(pos: Point2D) {
		const key = this.posToKey(pos.clone());

		const items = this.hash.get(key) ?? [];

		return items;
	}

	gridAt(pos: Point2D) {
		const key = this.gridPosToKey(pos.clone());

		const items = this.hash.get(key) ?? [];

		return items;
	}

	remove(data: T) {
		const key = this.key(data);

		const items = this.hash.get(key);
		if (!items) return;

		const idx = items.indexOf(data);
		if (idx < 0) return;

		items.splice(idx, 1);
	}

	nearby(pos: Point2D, size: number) {
		const tl = pos.clone().sub(size / 2).div(this.gridSize).floor();
		const br = pos.clone().add(size / 2).div(this.gridSize).floor();

		const items: T[] = [];

		for (let ty = tl.y; ty <= br.y; ty++) {
			for (let tx = tl.x; tx <= br.x; tx++) {
				const k = new Point2D(tx, ty).hash();
				items.push(...(this.hash.get(k) ?? []))
			}
		}

		return items;
	}

	withinRadius(pos: Point2D, radius: number) {
		const items = this.nearby(pos, radius * 2);

		return items.filter(i => {
			const itemPos = this.transform(i);
			return itemPos.distance(pos) <= radius;
		})
	}

}