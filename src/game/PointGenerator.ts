import { Assets, Container, Sprite, Texture } from "pixi.js";
import SpatialHash from "../logic/SpatialHash";
import { Point2D } from "../logic/Point2d";
import { random, range } from "radash";
import pointImage from '../assets/point.png';

export class PointGenerator {

	spatialHash = new SpatialHash<Sprite>(100, sprite => new Point2D(sprite.position.x, sprite.position.y));
	particles = new Container();
	pointTexture?: Texture;

	loaded: string[] = [];
	inEffect: Sprite[] = [];

	constructor() {

	}

	async init() {
		this.pointTexture = await Assets.load(pointImage)
	}

	handleViewportChanged(x: number, y: number, width: number, height: number) {
		const worldTopLeft = this.spatialHash.posToGridPos(new Point2D(x, y));
		const worldBottomRight = this.spatialHash.posToGridPos(new Point2D(x + width, y + height));

		const oldLoaded = this.loaded.slice();
		const newLoaded = [];

		for (let cx = worldTopLeft.x; cx <= worldBottomRight.x; cx++) {
			for (let cy = worldTopLeft.y; cy <= worldBottomRight.y; cy++) {
				newLoaded.push(this.loadChunk(new Point2D(cx, cy)));
			}
		}

		this.loaded = newLoaded;

		oldLoaded.forEach(key => {
			if (this.loaded.includes(key)) return;

			this.unloadChunk(key);
		})
	}

	loadChunk(chunkPos: Point2D) {
		const key = this.spatialHash.gridPosToKey(chunkPos);
		if (this.loaded.includes(key)) return key;

		const worldTopLeft = chunkPos.clone().mul(this.spatialHash.gridSize);
		const density = Math.round(Math.max(0, chunkPos.y * 0.02));

		for (let i = 0; i < density;) {
			const s = this.generate(random(worldTopLeft.x, worldTopLeft.x + this.spatialHash.gridSize), random(worldTopLeft.y, worldTopLeft.y + this.spatialHash.gridSize))
			// @ts-ignore
			i += s.xp;
		}

		return key;
	}

	unloadChunk(key: string) {
		const items = this.spatialHash.hash.get(key);
		this.spatialHash.hash.delete(key);

		if (items) {
			items.forEach(item => {
				// @ts-ignore
				if (item.inEffect) return;
				this.particles.removeChild(item);
			});
		}
	}

	generate(x: number, y: number, xp?: number) {
		const s = new Sprite(this.pointTexture!);

		if (!xp) {
			xp = Math.max(1, Math.random() * (y / 10000));
		}

		s.position.set(x, y);
		s.anchor.set(0.5);
		s.scale.set(0.2 + (Math.min(1, xp * 0.1)));
		// @ts-ignore
		s.xp = xp;

		this.spatialHash.add(s);
		this.particles.addChild(s)

		return s;
	}

	consume(s: Sprite) {
		// @ts-ignore
		s.inEffect = true;
		this.spatialHash.remove(s);
		// this.particles.removeChild(s)

		this.inEffect.push(s);
	}

	updateInEffect(mousePosV: Point2D) {
		const newPos = new Point2D();
		const newInEffect: Sprite[] = [];

		this.inEffect.forEach(s => {
			newPos.set(s.position.x, s.position.y);
			const dist = newPos.distance(mousePosV)
			newPos.reach(mousePosV, 2, Math.max(10, dist / 5));

			s.position.x = newPos.x;
			s.position.y = newPos.y;

			if (dist <= 10) {
				this.particles.removeChild(s);
				return;
			}


			newInEffect.push(s);
		})

		this.inEffect = newInEffect;
	}

	addEffect(x: number, y: number, xp: number) {
		this.consume(this.generate(x, y, xp));
	}
}