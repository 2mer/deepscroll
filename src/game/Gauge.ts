import { Container, Graphics } from "pixi.js";

export class Gauge {
	container = new Container();
	private graphics = this.container.addChild(new Graphics());

	strokeWidth = 5;
	outlineWidth = 5;
	radius = 12;
	private _progress = 0;
	color = 0x0066FF;

	constructor(private state: any) {

	}

	get progress() {
		return this._progress;
	}

	set progress(value: number) {
		this._progress = value;
		this.draw();
	}

	draw() {

		this.graphics
			.clear()
			.setStrokeStyle({ width: this.strokeWidth + this.outlineWidth, color: this.state.darkColor })
			.arc(0, 0, this.radius, 0, 360 * (Math.PI / 180))
			.circle(0, 0, this.radius)
			.stroke()
			.moveTo(this.radius, 0)
			.setStrokeStyle({ width: this.strokeWidth, color: this.color })
			.arc(0, 0, this.radius, 0, (360 * (Math.PI / 180)) * this.progress)
			.stroke()

	}
}