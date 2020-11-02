import { startManager, gameLoop } from './manager.js';
export { app };

WebFont.load({
    custom: {
        families: ['Edmunds'],
        urls: ['./font/fonts.css']
    }
});

let app = new PIXI.Application({
    width: 256,
    height: 256,
    antialias: true,
    transparent: false,
    resolution: 1
});

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

let TextureCache = PIXI.utils.TextureCache
let renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);

window.onload = function() {
    document.body.appendChild(app.view);
    app.renderer.backgroundColor = 0xd3cb81;
    setup();
}


function setup() {
    PIXI.loader
        .add('white crosshair', './img/white crosshair.png')
        .add('black crosshair', './img/black crosshair.png')
        .add('revolver', './img/revolver.png')
        .add('star', './img/star.png')
        .add('a', './img/a.png')
        .add('b', './img/b.png')
        .add('x', './img/x.png')
        .add('y', './img/y.png')
        .add('rt', './img/right trigger.png')
        .add('lstick', './img/left stick.png')
        .add('rstick', './img/right stick.png')
        .add('bullet', './img/bullet.png')
        .add('sand', './img/sand.png')
        .add('smoke', './img/smoke.png')
        .add('barrel', './img/map/barrel.png')
        .add('chariot', './img/map/chariot.png')
        .add('cactus', './img/map/cactus.png')
        .add('rock', './img/map/rock.png');

    //Load the two sets of cowboy textures
    loadCowboy('white');
    loadCowboy('black');

    PIXI.loader.load(startManager);
}

//Load all of the cowboys textures for a certain color of cowboy
//Textures are stored with a name like white_N_walk2
//Walk cycle would go walk9 --> walk0 and back again.
function loadCowboy(color) {
    let directions = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'];

    //Loop through all directions to get all images
    for (let i = 0; i < directions.length; i++) {
        //./img/cowboys/color/direction_action
        //Load idle texture for this direction. Frame number is always 0
        PIXI.loader.add(color + '_' + directions[i] + '_' + 'idle0',
            './img/cowboys/' + color + '/' + directions[i] + '_' + 'idle.png');

        //Load all of the walking textures for this direction
        for (let j = 0; j < 10; j++) {
            PIXI.loader.add(color + '_' + directions[i] + '_walk' + j,
                './img/cowboys/' + color + '/' + directions[i] + '_walk' + j + '.png');
        }

        //Load the shooting textures for this direction
        for (let j = 0; j < 3; j++) {
            PIXI.loader.add(color + '_' + directions[i] + '_' + 'shoot' + j,
                './img/cowboys/' + color + '/' + directions[i] + '_' + 'shoot' + j + '.png');
        }
    }
}