//Contains particle emitters and containers
export {smokeEmitter, smokeContainer};

let smokeContainer = new PIXI.Container();
let smokeEmitter = new PIXI.particles.Emitter(
	// Container to put emitter on
	smokeContainer,
	// The collection of particle images to use
	[PIXI.Texture.fromImage('./img/smoke.png')],

	// Emitter configuration
	{
		"alpha": {
			"start": 1,
			"end": 0
		},
		"scale": {
			"start": 1,
			"end": 0.8,
			"minimumScaleMultiplier": 1
		},
		"color": {
			"start": "#ffffff",
			"end": "#e6c45c"
		},
		"speed": {
			"start": 150,
			"end": 175,
			"minimumSpeedMultiplier": 1
		},
		"acceleration": {
			"x": 0,
			"y": 0
		},
		"maxSpeed": 1,
		"startRotation": {
			"min": 0,
			"max": 360
		},
		"noRotation": true,
		"rotationSpeed": {
			"min": 50,
			"max": 0
		},
		"lifetime": {
			"min": 0.5,
			"max": 5
		},
		"blendMode": "normal",
		"frequency": 0.03,
		"emitterLifetime": -1,
		"maxParticles": 500,
		"pos": {
			"x": 0,
			"y": 0
		},
		"addAtBack": true,
		"spawnType": "point"
	}
);