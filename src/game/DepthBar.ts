import { Container, Graphics, Text } from "pixi.js";
import { remap } from "../logic/math";

export class DepthBar {
	container = new Container();
	private graphics = this.container.addChild(new Graphics());
	private text = this.container.addChild(new Text());

	distancePerMark = 100;
	referenceSize = 100;
	height = 40;
	width = 15;
	strokeWidth = 4;
	outlineWidth = 0;
	private _depth = 0;
	color = 0x0066FF;
	depthScale = 1 / 100;

	constructor() {
		this.text.anchor.set(0, 0.5);
		this.text.position.set(this.width * 2, 0);
	}

	get depth() {
		return this._depth;
	}

	set depth(value: number) {
		this._depth = value * this.depthScale;
		this.text.text = String(Math.round(this.depth)) + 'm';
		this.draw();
	}

	draw() {

		const hw = this.width / 2;
		const hh = this.height / 2;

		this.graphics
			.clear()
			.setStrokeStyle({ width: this.strokeWidth + this.outlineWidth, color: 0, cap: 'round' })
			.moveTo(hw, -hh)
			.lineTo(hw, hh)

		const minWorld = (this.depth - (this.referenceSize / 2));
		const maxWorld = (this.depth + (this.referenceSize / 2));
		const minMark = Math.ceil(minWorld / this.distancePerMark) * this.distancePerMark;
		const maxMark = Math.floor(maxWorld / this.distancePerMark) * this.distancePerMark;

		for (let i = minMark; i <= maxMark; i += this.distancePerMark) {
			const ratio = remap(i, minWorld, maxWorld, 0, 1);
			const relativePos = remap(i, minWorld, maxWorld, -hh, hh);

			const ratioWidth = Math.sin(ratio * Math.PI) * this.width;
			const rhw = ratioWidth / 2

			this.graphics.moveTo(hw - rhw, relativePos).lineTo(hw + rhw, relativePos);
		}

		this.graphics.stroke();

	}
}