import { useEffect, useRef } from 'react';
import {
	Application,
	Assets,
	Container,
	DisplacementFilter,
	Graphics,
	mixHexColors,
	Sprite,
	Texture,
} from 'pixi.js';
import speedImage from './assets/speed.png';
import ascensionImage from './assets/ascension.png';
import reachImage from './assets/reach.png';
import cursorImage from './assets/cursor.png';
import generatorImage from './assets/generator.png';
import waterNormalsImage from './assets/waterNormals.jpg';
import { PointGenerator } from './game/PointGenerator';
import { Viewport } from 'pixi-viewport';
import { Point2D } from './logic/Point2d';
import { Gauge } from './game/Gauge';
import { DepthBar } from './game/DepthBar';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { Text as PixiText } from 'pixi.js';
import UpgradeCard from './components/UpgradeCard';

const availableUpgrades = [
	{
		id: 'speed',
		type: 'upgrade',
		image: speedImage,
		// apply: (state: any) => (state.speed += 1),
		apply: (state: any) => (state.speed += 1),
		remove: (state: any) => (state.speed -= 1),
	},
	{
		id: 'reach',
		type: 'upgrade',
		image: generatorImage,
		// apply: (state: any) => (state.reach += 10),
		apply: (state: any) => (state.reach += 10),
		remove: (state: any) => (state.reach -= 10),
	},
	{
		image: reachImage,
		type: 'upgrade',
		id: 'generator',
		apply: (state: any) => (state.genXp += 1),
		remove: (state: any) => (state.genXp -= 1),
	},
];

const availableArtifacts = [
	{
		id: 'ascension',
		type: 'artifact',
		persistent: true,
		image: ascensionImage,
		description: '+100% xp',
		// apply: (state: any) => (state.speed += 1),
		apply: (state: any) => (state.persistent.mul += 1),
		remove: (state: any) => (state.persistent.mul -= 1),
	},
];

const allImages = [...availableUpgrades, ...availableArtifacts].map(
	(e) => e.image
);

type Upgrade = {
	persistent?: boolean;
	type: string;
	id: string;
	image: string;
	apply: (state: any) => void;
	remove: (state: any) => void;
	container: Container;
};

function App() {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		async function run() {
			const app = new Application();
			const canvas = ref.current!;

			await app.init({
				resizeTo: window,
				background: '#679ee0',
				canvas,
				antialias: true,
			});

			const viewport = new Viewport({
				events: app.renderer.events,

				worldWidth: window.innerWidth,
				worldHeight: window.innerHeight,

				screenWidth: window.innerWidth,
				screenHeight: window.innerHeight,
			});

			const wrongWayText = viewport.addChild(
				new PixiText({ text: 'wrong way chump' })
			);
			wrongWayText.anchor.set(0.5);
			wrongWayText.position.set(0, -5000);

			const titleText = viewport.addChild(
				new PixiText({
					text: 'DOPAMINE\nDIVE',
					style: { fontFamily: 'Bebas Neue', fontSize: 300 },
				})
			);
			titleText.anchor.set(0.5);
			titleText.position.set(0, -1000);
			const ttBounds = titleText.getBounds();

			for (let i = 0; i < 5; i++) {
				const ScrollDownText = viewport.addChild(
					new PixiText({
						text: 'SCROLL ⬇',
						style: { fontFamily: 'Bebas Neue', fontSize: 50 },
						alpha: (5 - i) / 5,
					})
				);
				ScrollDownText.anchor.set(1);
				ScrollDownText.position.set(
					ttBounds.right,
					ttBounds.bottom - 225 + i * 80
				);
			}

			const mulText = viewport.addChild(
				new PixiText({
					text: '',
					style: { fontFamily: 'Bebas Neue', fontSize: 50 },
					alpha: 0.6,
				})
			);
			mulText.anchor.set(0);
			mulText.position.set(ttBounds.left + 15, ttBounds.bottom);

			const defaultState = {
				depth: -1000,
				xp: 0,
				level: 0,
				maxXp: 50,
				reach: 40,
				speed: 1,
				genXp: 0,
				upgrades: [],
				paused: false,
				iframes: 0,
				persistent: {
					maxDepth: 1000 * 100,
					// maxDepth: 100 * 100,
					mul: 1,
					inAscension: false,
				},
				darkColor: 0,
			};

			const state = {
				...defaultState,
				upgrades: [...defaultState.upgrades],
			};

			await Assets.load(
				[...availableUpgrades, ...availableArtifacts].map(
					(e) => e.image
				)
			);

			const upgradeChain: Upgrade[] = [];

			function updateUpgrades() {
				drawRangeGraphics();
			}

			function checkLevelup() {
				if (state.persistent.inAscension) return;

				if (state.xp >= state.maxXp) {
					state.xp -= state.maxXp;
					state.maxXp = state.maxXp * 2;
					state.level++;
					state.paused = true;

					modals.open({
						modalId: 'levelup',
						size: '100%',
						children: (
							<div className='flex flex-col gap-10 items-center'>
								<Text variant='gradient' fw={900} fz={'50px'}>
									Leveled up!
								</Text>

								<div className='flex gap-10 justify-center'>
									{availableUpgrades.map((upgrade, index) => {
										return (
											<UpgradeCard
												index={index}
												upgrade={upgrade}
												key={upgrade.id}
												onClick={() => {
													modals.close('levelup');

													const upgradeContainer =
														new Container();
													const upgradeSprite =
														new Sprite(
															Texture.from(
																upgrade.image
															)
														);

													upgradeSprite.anchor.set(
														0.5
													);

													upgradeSprite.scale.set(
														0.4
													);
													upgradeSprite.position.set(
														0
													);

													upgradeContainer.addChild(
														upgradeSprite
													);

													upgradeChain.push({
														...upgrade,
														container:
															upgradeContainer,
													});
													viewport.addChild(
														upgradeContainer
													);

													upgrade?.apply(state);

													// const vCursor =
													// 	viewport.toLocal({
													// 		x: cursor.position
													// 			.x,
													// 		y: cursor.position
													// 			.y,
													// 	});
													// upgradeContainer.position.set(
													// 	vCursor.x,
													// 	vCursor.y
													// );

													updateGaugePositions();

													updateUpgrades();

													state.iframes = 60 * 2;
													state.paused = false;

													checkLevelup();
												}}
											/>
										);
									})}
								</div>

								<Text variant='gradient' fw={900} fz={'20px'}>
									... pick one ...
								</Text>
							</div>
						),
						withCloseButton: false,
						closeOnClickOutside: false,
						closeOnEscape: false,
						centered: true,
						overlayProps: { blur: 3 },
						style: {
							background: 'transparent',
						},
					});
				}
			}

			function checkDepth() {
				if (
					state.depth + cursor.position.y >=
					state.persistent.maxDepth
				) {
					state.persistent.inAscension = true;

					state.paused = true;
					modals.closeAll();
					modals.open({
						modalId: 'depth',
						size: '100%',
						children: (
							<div className='flex flex-col gap-10 items-center'>
								<Text variant='gradient' fw={900} fz={'50px'}>
									Substantial depth reached
								</Text>
								<Text variant='gradient' fw={900} fz={'30px'}>
									{state.persistent.maxDepth / 100}m
								</Text>

								<div className='flex gap-10 justify-center'>
									{availableArtifacts.map(
										(upgrade, index) => {
											return (
												<UpgradeCard
													index={index}
													upgrade={upgrade}
													key={upgrade.id}
													onClick={() => {
														modals.close('depth');

														state.persistent.maxDepth *= 2;
														const oldState = {
															...state,
														};

														Object.assign(
															state,
															defaultState
														);
														state.upgrades = [];
														state.persistent =
															oldState.persistent;

														upgradeChain
															.slice()
															.forEach((c) => {
																if (
																	!c.persistent
																) {
																	viewport.removeChild(
																		c.container
																	);
																	upgradeChain.splice(
																		upgradeChain.indexOf(
																			c
																		),
																		1
																	);
																}
															});

														const upgradeContainer =
															new Container();
														const upgradeSprite =
															new Sprite(
																Texture.from(
																	upgrade.image
																)
															);

														upgradeSprite.anchor.set(
															0.5
														);

														upgradeSprite.scale.set(
															0.4
														);
														upgradeSprite.position.set(
															0
														);

														upgradeContainer.addChild(
															upgradeSprite
														);

														upgradeChain.push({
															...upgrade,
															container:
																upgradeContainer,
														});
														viewport.addChild(
															upgradeContainer
														);

														upgrade?.apply(state);

														state.iframes = 60 * 2;
														state.paused = false;
														state.persistent.inAscension =
															false;

														viewportWish.position.set(
															0,
															state.depth
														);

														updateUpgrades();

														snapViewport();

														updateGaugePositions();

														updateXpGauge();
														ascensionGauge.progress = 0;

														mulText.text =
															'x' +
															state.persistent
																.mul;

														updateBackground();
													}}
												/>
											);
										}
									)}
								</div>

								<Text variant='gradient' fw={900} fz={'20px'}>
									... pick one ...
								</Text>
							</div>
						),
						withCloseButton: false,
						closeOnClickOutside: false,
						closeOnEscape: false,
						centered: true,
						overlayProps: { blur: 3 },
						style: {
							background: 'transparent',
						},
					});
				}
			}

			function updateXpGauge() {
				xpGauge.progress = Math.min(state.xp / state.maxXp, 1);
			}

			function addXp(xp: number) {
				state.xp += xp * state.persistent.mul;

				checkLevelup();

				updateXpGauge();
			}

			// function removeXp(v: number) {
			// 	if (v < 1) return 0;

			// 	state.xp -= v;
			// 	if (state.xp < 0) {
			// 		state.xp = 0;
			// 		if (state.level > 0) {
			// 			state.maxXp /= 2;

			// 			const up = upgradeChain.pop()!;

			// 			viewport.removeChild(up.container);
			// 			up.remove(state);
			// 		}
			// 	}

			// 	updateXpGauge();

			// 	return v;
			// }

			const viewportWish = app.stage.addChild(new Container());
			viewportWish.position.y = state.depth;

			function snapViewport() {
				viewport.moveCenter(
					viewportWish.position.x,
					viewportWish.position.y
				);
			}

			snapViewport();

			viewport.follow(viewportWish, {
				speed: 1,
				acceleration: 3,
				radius: 20,
			});

			const pointGenerator = new PointGenerator();
			const [cursorTexture, waterTexture] = await Promise.all([
				Assets.load(cursorImage),
				Assets.load(waterNormalsImage),
				pointGenerator.init(),
			]);

			const cursor = new Container();

			const sprite = Sprite.from(cursorTexture);
			sprite.position.set(2, 2);
			sprite.scale.set(0.18);

			const xpGauge = new Gauge(state);
			viewport.addChild(xpGauge.container);
			xpGauge.draw();
			const ascensionGauge = new Gauge(state);
			viewport.addChild(ascensionGauge.container);
			ascensionGauge.color = 0xc542f5;
			ascensionGauge.radius = 8;
			ascensionGauge.draw();
			// const hpGauge = new Gauge();
			// hpGauge.color = 0xff0000;
			// hpGauge.radius = 15;
			// hpGauge.draw();
			// viewport.addChild(hpGauge.container);

			updateBackground();

			const depthBar = new DepthBar(state);
			depthBar.container.position.set(40, 25);
			cursor.addChild(depthBar.container);

			const rangeGraphics = cursor.addChild(new Graphics());

			function drawRangeGraphics() {
				rangeGraphics.clear().setStrokeStyle({
					width: 1,
					color: 0x0066ff,
					alpha: 0.2,
				});
				rangeGraphics.circle(0, 0, state.reach);
				rangeGraphics.stroke();
			}

			drawRangeGraphics();

			cursor.addChild(sprite);

			const hitPoint = new Point2D();
			function checkHits() {
				if (state.paused) return;

				const bounds = viewport.getVisibleBounds();

				hitPoint.set(
					cursor.position.x + bounds.x,
					cursor.position.y + bounds.y
				);
				const hits = pointGenerator.spatialHash.withinRadius(
					hitPoint,
					state.reach
				);

				hits.forEach((hit) => {
					// @ts-ignore
					addXp(hit.xp);
					pointGenerator.consume(hit);
				});
			}

			function updateGaugePositions() {
				const vCursor = viewport.toLocal(cursor.position);

				const cursorPos = new Point2D(vCursor.x, vCursor.y);

				const chain = [
					{ container: xpGauge.container },
					{ container: ascensionGauge.container },
					...upgradeChain,
				];

				const lastLinkPoint = new Point2D().set(cursorPos);
				const linkPoint = new Point2D();
				for (const link of chain) {
					linkPoint.set(
						link.container.position.x,
						link.container.position.y
					);
					linkPoint.reach(lastLinkPoint, 50);
					link.container.position.set(linkPoint.x, linkPoint.y);

					lastLinkPoint.set(linkPoint);
				}

				depthBar.depth = vCursor.y;
			}

			document.body.addEventListener('mousemove', (e) => {
				cursor.position.set(e.clientX, e.clientY);

				updateGaugePositions();
				checkHits();
			});

			canvas.addEventListener('wheel', (e) => {
				if (state.depth < -5000 && e.deltaY < 0) return;

				// state.depth += e.deltaY * ((1 + state.speed / 10) * 0.5);
				viewportWish.position.y +=
					e.deltaY * ((1 + state.speed / 10) * 0.5);

				// viewportWish.position.y = state.depth;
			});

			viewport.addListener('moved', () => {
				const bounds = viewport.getVisibleBounds();

				state.depth = bounds.y;
				ascensionGauge.progress = Math.max(
					0,
					state.depth / state.persistent.maxDepth
				);

				pointGenerator.handleViewportChanged(
					bounds.x,
					bounds.y,
					bounds.width,
					bounds.height
				);

				updateGaugePositions();
				checkHits();

				checkDepth();

				updateBackground();
			});

			function updateBackground() {
				const ratio = Math.min(
					1,
					Math.max(0, state.depth / (10_000 * 100))
				);

				state.darkColor = ratio > 0.5 ? 0xfffc47 : 0;

				const color = mixHexColors(0x5cd0fa, 0x00050d, ratio);

				app.renderer.background.color = color;
			}

			app.stage.addChild(viewport);
			viewport.addChild(pointGenerator.particles);
			pointGenerator.particles.zIndex = -1;

			app.stage.addChild(cursor);

			const displacementSprite = new Sprite(waterTexture);
			displacementSprite.scale.set(10);

			const vCursorPos = new Point2D();
			app.ticker.add(() => {
				displacementSprite.position.y += 1;
				displacementSprite.position.x += 0.1;

				const vCursor = xpGauge.container.position;
				vCursorPos.set(vCursor.x, vCursor.y);
				pointGenerator.updateInEffect(vCursorPos);

				if (state.paused) return;

				upgradeChain.forEach((upgrade) => {
					if (upgrade.id === 'generator') {
						// @ts-ignore
						upgrade.tick ??= 0;
						// @ts-ignore
						upgrade.tick++;

						// @ts-ignore
						if (upgrade.tick >= 10) {
							// @ts-ignore
							upgrade.tick -= 10;

							const xp = state.genXp;
							addXp(xp);
							pointGenerator.addEffect(
								upgrade.container.x,
								upgrade.container.y,
								xp
							);
						}
					}
				});
			});

			displacementSprite.texture.baseTexture.repeatMode = 'repeat';

			app.stage.addChild(displacementSprite);

			viewport.filters = [
				new DisplacementFilter({
					sprite: displacementSprite,
					scale: {
						x: 30,
						y: 30,
					},
				}),
			];
		}

		run();
	}, []);

	return (
		<>
			<canvas ref={ref} />
			<div className='hidden'>
				{allImages.map((i) => (
					<img key={i} src={i} />
				))}
			</div>
		</>
	);
}

export default App;
