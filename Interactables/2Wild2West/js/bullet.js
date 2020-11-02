export { Bullet };
import { app } from './loader.js';
class Bullet {
    constructor(cowboy, bf) {
        this.sprite = new PIXI.Sprite(PIXI.loader.resources["bullet"].texture);
        this.sprite.anchor.set(0.5, 0.5);
        this.fwd = bf;
        this.playerNum = cowboy.playerNum;
        this.velocity = {};
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.speed = 10;
        this.inBounds = true;

        this.normalize(this.fwd);
        this.sprite.position = cowboy.sprite.position;
        this.sprite.position.x += cowboy.sprite.width / 2 * this.fwd.x;
        this.sprite.position.y += cowboy.sprite.height / 2 * this.fwd.y;

        this.rotateSprite();

    }

    move(delta) {
        this.velocity.x = this.fwd.x * this.speed;
        this.velocity.y = this.fwd.y * this.speed;

        this.sprite.position.x += this.velocity.x * delta;
        this.sprite.position.y += this.velocity.y * delta;
        this.checkBounds();
    }


    //Rotates sprite to point towards crosshair
    rotateSprite() {
        let axis = {};
        axis.x = 1;
        axis.y = 0;
        let angle = Math.acos((this.fwd.x * axis.x) + (this.fwd.y * axis.y));

        if (this.fwd.y < 0)
            this.sprite.rotation -= angle;
        else
            this.sprite.rotation += angle;
    }

    //Normalizes vector
    normalize(vector2) {
        let squareSum = Math.sqrt(Math.pow(vector2.x, 2) + Math.pow(vector2.y, 2));
        if (squareSum != 1) {
            vector2.x /= squareSum;
            vector2.y /= squareSum;
        }

    }

    checkBounds() {
        let x = this.sprite.position.x;
        let y = this.sprite.position.y;
        let spriteHalfWidth = this.sprite.width / 2;
        let spriteHalfHeight = this.sprite.height / 2;
        let stageWidth = app.renderer.width;
        let stageHeight = app.renderer.height;

        if (x - spriteHalfWidth <= 0 || x + spriteHalfWidth >= stageWidth || y + spriteHalfHeight >= stageHeight || y - spriteHalfHeight <= 0)
            this.inBounds = false;


    }
}