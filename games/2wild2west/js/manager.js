export { startManager, gameLoop, gameContainer, b, addBullet };
import { Bump } from './bump.js';
import { app } from './loader.js';
import { gamepads, pollGamepads, setGamepadConnectionEvents, numPads } from './controllers.js';
import { Cowboy } from './cowboy.js';
import { smokeEmitter, smokeContainer } from './emitters.js';

//Debug variables
const SKIP_MENU = false; //Skips over the menu whether or not controllers are connected

//Core game variables
let state = menu;
let players = []; //Holds the player objects
let bulletList = []; //Holds the active bullets present in the game
let mapList = []; //Holds the map *sprites*
let bg;

//UI Variables
let menuContainer = new PIXI.Container();
let instructContainer = new PIXI.Container();
let gameContainer = new PIXI.Container();
let goContainer = new PIXI.Container(); //Game over

//Text and styles
let fontStyle = new PIXI.TextStyle({
	fontFamily: "Edmunds",
	fontSize: 100,
	fill: "black",
	stroke: 'white'
});
let titleStyle = new PIXI.TextStyle({
	fontFamily: "Edmunds",
	fontSize: 100,
	fill: "black",
	stroke: 'white',
	strokeThickness: 4,
	dropShadow: true,
	dropShadowColor: "#000000",
	dropShadowBlur: 6,
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 4
});
let controlText;

//Bump.js variable
let b = new Bump(PIXI);

//Audio variables
let menuMusic = new Howl({
	src: ['./audio/menuloop.wav'],
	volume: 0.4,
	loop: true
});

let deathSound = new Howl({
	src: ['./audio/death.mp3'],
	volume: 0.7
});

let hitSound1 = new Howl({
	src: ['./audio/woodhit1.mp3'],
	volume: 1
});
let hitSound2 = new Howl({
	src: ['./audio/woodhit2.mp3'],
	volume: 1
});

let hitSounds = [hitSound1, hitSound2]; //Hold different hit sounds to choose from when bullets hit the map

//Particle variables
let smokeTime = 250; //Time smoke effect happens
let currSmokeTime = 0; //Current time smoke effect has been running

//Initializes manager itself
function startManager() {
	setGamepadConnectionEvents();
	app.ticker.add(delta => gameLoop(delta))

	if (SKIP_MENU) {
		state = play;
		initGame(2);
		return;
	}
	loadBG();
	createMap();

	//Set up containers for the menus
	initInstructions();
	initGO();
	initMenu();

}

//Load the tiling background
function loadBG() {
	bg = new PIXI.extras.TilingSprite(PIXI.loader.resources['sand'].texture, app.renderer.width, app.renderer.height);
	app.stage.addChild(bg);
}

//Wrapper to run the proper loop for the proper game state
function gameLoop(delta) {
	state(delta);
}

//The loop when at the menu
function menu(delta) {
	pollGamepads();
	controlText.text = "Controllers Connected: " + numPads;

	//Check if 1st controller changes to game or instructions
	if (numPads > 0) { //Avoid querying gamepad that doesn't exist
		if (gamepads[0].buttons[0].pressed)
			switchState(play);
		if (gamepads[0].buttons[3].pressed)
			switchState(instructions);
	}

}

//The loop when at the instructions
function instructions(delta) {
	pollGamepads();

	//Check if 1st controller changes back to menu
	if (numPads > 0) {
		if (gamepads[0].buttons[1].pressed)
			switchState(menu);
	}
}

//The loop when in the play state
function play(delta) {
	pollGamepads();

	for (let i = 0; i < players.length; i++) {
		players[i].update(delta);
	}
	for (let i = 0; i < bulletList.length; i++) {
		bulletList[i].move(delta);
		if (!bulletList[i].inBounds)
			removeBullet(bulletList[i]);
	}
	collisions();

	//Update smoke effect if it's active and switch to game over if it's done
	if (smokeEmitter.emit) {
		smokeEmitter.update(delta * 0.01);
		currSmokeTime += delta;
		if (currSmokeTime >= smokeTime) {
			smokeEmitter.emit = false;
			switchState(gameover);
		}
	}


}

function gameover() {
	pollGamepads();

	//Check if 1st controller changes back to menu
	if (numPads > 0) {
		if (gamepads[0].buttons[1].pressed) {
			reset();
		}
	}
}


function switchState(nextState) {
	switch (nextState) {
		case play:
			//Don't allow the game to start if there aren't enough gamepads
			if (numPads < 2) {
				let warnText = new PIXI.Text('Please connect 2 controllers to play.', fontStyle);
				warnText.position.set(controlText.x, controlText.y + 50);
				menuContainer.addChild(warnText);
				return;
			}
			menuMusic.stop();
			initGame(numPads > 2 ? 2 : numPads);
			clearCanvas();
			app.stage.addChild(gameContainer);
			state = play;
			break;
		case menu:
			Howler.mute(false);
			clearCanvas();
			app.stage.addChild(menuContainer);
			if (!menuMusic.playing())
				menuMusic.play();
			state = menu;
			break;
		case instructions:
			clearCanvas();
			app.stage.addChild(instructContainer);
			state = instructions;
			break;
		case gameover:
			Howler.mute(true);
			clearCanvas();
			app.stage.addChild(goContainer);
			state = gameover;
			break;
					 }
}

//Clears all containers off the canvas
function clearCanvas() {
	app.stage.removeChild(menuContainer);
	app.stage.removeChild(instructContainer);
	app.stage.removeChild(gameContainer);
	app.stage.removeChild(goContainer);
}

//Start up the main menu with all graphics
function initMenu() {
	//Title Message
	let titleText = new PIXI.Text("2 Wild 2 West", titleStyle);
	titleText.anchor.set(0.5);
	titleText.position.set(app.renderer.width / 2, 200);
	menuContainer.addChild(titleText);

	//Controller Status
	controlText = new PIXI.Text("Controllers Connected: " + numPads, fontStyle);
	controlText.position.set(100, app.renderer.height - (app.renderer.height / 6));
	app.stage.addChild(controlText);
	menuContainer.addChild(controlText);

	//Star Sprite
	let starButton = new PIXI.Sprite(PIXI.loader.resources["star"].texture);
	starButton.scale.x = 0.2;
	starButton.scale.y = 0.2;
	starButton.x = -starButton.width / 2;
	starButton.y = -110;

	//Button Text
	fontStyle.fontSize = 50;
	let buttonMessage = new PIXI.Text("Start", fontStyle);
	buttonMessage.anchor.set(0.5);

	//A Button
	let aButton = new PIXI.Sprite(PIXI.loader.resources["a"].texture);
	aButton.anchor.set(0.5);
	aButton.scale.x = 0.02;
	aButton.scale.y = 0.02;
	aButton.y = 40;

	//Add to start container and positioning
	let startContainer = new PIXI.Container();
	startContainer.addChild(starButton);
	startContainer.addChild(buttonMessage);
	startContainer.addChild(aButton);
	startContainer.x = app.renderer.width / 2;
	startContainer.y = titleText.position.y + 200;

	//Make it interactable
	startContainer.interactive = true;
	startContainer.buttonMode = true;
	startContainer.on('pointerdown', (event) => {
		switchState(play);
	});

	//Instruction button
	let tutButton = new PIXI.Text("Instructions", fontStyle);
	tutButton.anchor.set(0.5);
	tutButton.x = app.renderer.width / 2;
	tutButton.y = 600;
	tutButton.interactive = true;
	tutButton.buttonMode = true;
	tutButton.on('pointerdown', (event) => {
		switchState(instructions);
	});

	//Y Button
	let yButton = new PIXI.Sprite(PIXI.loader.resources["y"].texture);
	yButton.anchor.set(0.5);
	yButton.scale.x = 0.02;
	yButton.scale.y = 0.02;
	yButton.y = 50;

	tutButton.addChild(yButton);

	menuContainer.addChild(startContainer);
	menuContainer.addChild(tutButton);

	switchState(menu); //Switch over to the menu when it loads
}

function initInstructions() {

	let instructText = new PIXI.Text('Instructions', titleStyle);
	instructText.anchor.set(0.5);
	instructText.position.set(app.renderer.width / 2, 100);

	//Variables to line up the instructions
	let bottomMargin = 100;
	let textX = app.renderer.width / 2 - 100;
	let currY = 300;
	let textImgGap = 125;

	//Instructions text and images
	//Left Stick
	let moveText = new PIXI.Text('Move:', fontStyle);
	moveText.anchor.set(0.5);
	moveText.position.set(textX, currY);
	currY += bottomMargin;

	let moveImg = new PIXI.Sprite(PIXI.loader.resources['lstick'].texture);
	moveImg.anchor.set(0.5);
	moveImg.scale.x = 0.04;
	moveImg.scale.y = 0.04;
	moveImg.x = moveText.position.x + textImgGap;
	moveImg.y = moveText.position.y;

	//Right Stick
	let aimText = new PIXI.Text('Aim:', fontStyle);
	aimText.anchor.set(0.5);
	aimText.position.set(textX, currY);
	currY += bottomMargin;

	let aimImg = new PIXI.Sprite(PIXI.loader.resources['rstick'].texture);
	aimImg.anchor.set(0.5);
	aimImg.scale.x = 0.04;
	aimImg.scale.y = 0.04;
	aimImg.x = aimText.position.x + textImgGap;
	aimImg.y = aimText.position.y;

	//Right Trigger
	let shootText = new PIXI.Text('Shoot:', fontStyle);
	shootText.anchor.set(0.5);
	shootText.position.set(textX, currY);
	currY += bottomMargin;

	let shootImg = new PIXI.Sprite(PIXI.loader.resources['rt'].texture);
	shootImg.anchor.set(0.5);
	shootImg.scale.x = 1;
	shootImg.scale.y = 1;
	shootImg.x = shootText.position.x + textImgGap;
	shootImg.y = shootText.position.y;

	//X
	let reloadText = new PIXI.Text('Reload:', fontStyle);
	reloadText.anchor.set(0.5);
	reloadText.position.set(textX, currY);
	currY += bottomMargin;

	let reloadImg = new PIXI.Sprite(PIXI.loader.resources['x'].texture);
	reloadImg.anchor.set(0.5);
	reloadImg.scale.x = 0.04;
	reloadImg.scale.y = 0.04;
	reloadImg.x = reloadText.position.x + textImgGap;
	reloadImg.y = reloadText.position.y;

	//Back to menu button
	let backButton = new PIXI.Text("Back to Menu", fontStyle);
	backButton.anchor.set(0.5);
	backButton.x = app.renderer.width / 2;
	backButton.y = 800;
	backButton.interactive = true;
	backButton.buttonMode = true;
	backButton.on('pointerdown', (event) => {
		switchState(menu);
	});

	//B button for menu
	let bButton = new PIXI.Sprite(PIXI.loader.resources['b'].texture);
	bButton.anchor.set(0.5);
	bButton.scale.x = 0.02;
	bButton.scale.y = 0.02;
	bButton.y = 50;
	backButton.addChild(bButton);


	//Add sprites to instruction container
	instructContainer.addChild(instructText);
	instructContainer.addChild(moveText);
	instructContainer.addChild(moveImg);
	instructContainer.addChild(aimText);
	instructContainer.addChild(aimImg);
	instructContainer.addChild(shootText);
	instructContainer.addChild(shootImg);
	instructContainer.addChild(reloadText);
	instructContainer.addChild(reloadImg);
	instructContainer.addChild(backButton);
}

//Start up the core game when in the play state
function initGame(numPlayers) {
	if (numPlayers == 0) {
		return;
	}

	for (let i = 0; i < mapList.length; i++) {
		gameContainer.addChild(mapList[i]);

	}
	//Init all players
	for (let i = 0; i < numPlayers; i++) {
		players[i] = new Cowboy(i + 1);

		gameContainer.addChild(players[i].sprite);
		gameContainer.addChild(players[i].revolver);
	}

	//Add particle system
	smokeEmitter.emit = false;
	gameContainer.addChild(smokeContainer);

}

//Initialize game over ui
function initGO() {
	//Back to menu button
	let backButton = new PIXI.Text("Back to Menu", fontStyle);
	backButton.anchor.set(0.5);
	backButton.x = app.renderer.width / 2;
	backButton.y = 800;
	backButton.interactive = true;
	backButton.buttonMode = true;
	backButton.on('pointerdown', (event) => {
		reset();
	});

	//B button back to menu
	let bButton = new PIXI.Sprite(PIXI.loader.resources['b'].texture);
	bButton.anchor.set(0.5);
	bButton.scale.x = 0.02;
	bButton.scale.y = 0.02;
	bButton.y = 50;
	backButton.addChild(bButton);

	//Developer names
	let devNames = new PIXI.Text("Created by William Montgomery and Sanketh Bhat", fontStyle);
	devNames.x = 50;
	devNames.y = 20;

	goContainer.addChild(backButton);
	goContainer.addChild(devNames);
}

function createMap() {
	let barrel1 = new PIXI.Sprite(PIXI.loader.resources['barrel'].texture);
	barrel1.x = 500;
	barrel1.y = 500;
	mapList.push(barrel1);

	let barrel2 = new PIXI.Sprite(PIXI.loader.resources['barrel'].texture);
	barrel2.x = app.renderer.width - 500;
	barrel2.y = app.renderer.height - 500;
	mapList.push(barrel2);

	let barrel3 = new PIXI.Sprite(PIXI.loader.resources['barrel'].texture);
	barrel3.x = 850;
	barrel3.y = 900;
	mapList.push(barrel3);

	let barrel4 = new PIXI.Sprite(PIXI.loader.resources['barrel'].texture);
	barrel4.x = app.renderer.width - 850;
	barrel4.y = app.renderer.height - 900;
	mapList.push(barrel4);

	let chariot1 = new PIXI.Sprite(PIXI.loader.resources['chariot'].texture);
	chariot1.x = 800;
	chariot1.y = 250;
	chariot1.scale.x = 2;
	chariot1.scale.y = 2;
	mapList.push(chariot1);

	let chariot2 = new PIXI.Sprite(PIXI.loader.resources['chariot'].texture);
	chariot2.x = app.renderer.width - 800;
	chariot2.y = app.renderer.height - 250;
	chariot2.scale.x = 2;
	chariot2.scale.y = 2;
	mapList.push(chariot2);


	let cactus1 = new PIXI.Sprite(PIXI.loader.resources['cactus'].texture);
	cactus1.x = 600;
	cactus1.y = 800;
	mapList.push(cactus1);

	let cactus2 = new PIXI.Sprite(PIXI.loader.resources['cactus'].texture);
	cactus2.x = app.renderer.width - 600;
	cactus2.y = app.renderer.height - 800;
	mapList.push(cactus2);

	let cactus3 = new PIXI.Sprite(PIXI.loader.resources['cactus'].texture);
	cactus3.x = 700;
	cactus3.y = 400;
	mapList.push(cactus3);

	let cactus4 = new PIXI.Sprite(PIXI.loader.resources['cactus'].texture);
	cactus4.x = app.renderer.width - 700;
	cactus4.y = app.renderer.height - 400;
	mapList.push(cactus4);


	let rock1 = new PIXI.Sprite(PIXI.loader.resources['rock'].texture);
	rock1.x = 300;
	rock1.y = 200;
	mapList.push(rock1);

	let rock2 = new PIXI.Sprite(PIXI.loader.resources['rock'].texture);
	rock2.x = app.renderer.width - 300;
	rock2.y = app.renderer.height - 200;
	mapList.push(rock2);

	let rock3 = new PIXI.Sprite(PIXI.loader.resources['rock'].texture);
	rock3.x = app.renderer.width / 2;
	rock3.y = app.renderer.height / 2;
	mapList.push(rock3);


	for (let i = 0; i < mapList.length; i++)
		mapList[i].anchor.set(0.5);
}

//Add a bullet to the bullet list
function addBullet(bullet) {
	bulletList.push(bullet);
	gameContainer.addChild(bullet.sprite);
}

//Remove bullet from the bullet list
function removeBullet(bullet) {
	let index = bulletList.indexOf(bullet);
	if (index != -1) {
		gameContainer.removeChild(bullet.sprite);
		bulletList.splice(index, 1);
		bullet = null;
	}
}

//Kills player from index passed in and starts process to end the game
function killPlayer(deadPlayer) {
	//Set up gameover text based on dead player

	for (let i = 0; i < bulletList.length; i++) {
		if (bulletList[i].playerNum == deadPlayer)
			removeBullet(bulletList[i]);
	}

	let titleText = new PIXI.Text();
	if (deadPlayer == 2)
		titleText = new PIXI.Text("White Hat Wins!", titleStyle);
	if (deadPlayer == 1)
		titleText = new PIXI.Text("Black Hat Wins!", titleStyle);
	titleText.anchor.set(0.5);
	titleText.position.set(app.renderer.width / 2, 400);
	goContainer.addChild(titleText);

	smokeEmitter.resetPositionTracking();
	smokeEmitter.updateSpawnPos(players[deadPlayer - 1].sprite.x, players[deadPlayer - 1].sprite.y);
	smokeEmitter.emit = true; //GameOver will happen in update after

	deathSound.play();
}


//Game Collisions
function collisions() {

	if (players[1] != null) {
		//Player - Player intersection
		b.hit(players[0].sprite, players[1].sprite, true);
		b.hit(players[1].sprite, players[0].sprite, true);
		//Player - map intersection
		b.hit(players[1].sprite, mapList, true);
	}
	//Player - map intersection
	b.hit(players[0].sprite, mapList, true);


	for (var i = 0; i < bulletList.length; i++) {
		//Player  - bullet collisions
		if (bulletList[i].playerNum == 2) {
			if (b.hit(players[0].sprite, bulletList[i].sprite)) {
				removeBullet(bulletList[i]);
				players[0].HP--;
				if (players[0].HP == 0) {
					killPlayer(1);
				}
			}
		} else if (bulletList[i].playerNum == 1) {
			if (players[1] != null)
				if (b.hit(players[1].sprite, bulletList[i].sprite)) {
					removeBullet(bulletList[i]);
					players[1].HP--;
					if (players[1].HP == 0) {
						killPlayer(2);
					}
				}
		}

		//Map-Bullet collisions
		for (var j = 0; j < mapList.length; j++)
			//Make sure bullet still exists before checking
			if (bulletList[i] && b.hit(bulletList[i].sprite, mapList[j])) {
				removeBullet(bulletList[i]);

				//Play a hit sound from the hitsounds array
				let hitIndex = Math.floor(Math.random() * hitSounds.length);
				hitSounds[hitIndex].play();
				break;
			}
	}
}

//Reset game variables
function reset() {

	//Remove bullets
	for (let i = 0; i < bulletList.length; i++)
		removeBullet(bulletList[i]);

	//Remove cowboys
	for (let i = 0; i < players.length; i++) {
		gameContainer.removeChild(players[i].sprite);
		gameContainer.removeChild(players[i].revolver);
	}

	//Reset particles
	smokeEmitter.cleanup();
	currSmokeTime = 0;

	switchState(menu);
}