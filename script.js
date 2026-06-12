const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};
let previousKeys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

class Player {
    static all = [];
    constructor(x, y, width, height, up, down, left, right, color) {
        this.width = width;
        this.height = height;

        this.x = x - this.width / 2;
        this.y = y - this.height / 2;

        this.up = up;
        this.down = down;
        this.left = left;
        this.right = right;

        this.color = color;

        this.velocityX = 0;
        this.velocityY = 0;

        this.speed = 5;
        this.gravity = 0.5;
        this.jumpStrength = -12;

        this.onFloor = false;
        this.doubleJumpUsed = false;

        this.onPlatform = false;

        Player.all.push(this);
    }

    static getAll() {
        return Player.all;
    }

    update() {
        if (keys[this.left]) {
            this.velocityX = -this.speed;
        }
        else if (keys[this.right]) {
            this.velocityX = this.speed;
        }
        else {
            this.velocityX = 0;
        }

        const jumpPressed =
            keys[this.up] && !previousKeys[this.up];

        if (jumpPressed) {
            if (this.onFloor) {
                this.velocityY = this.jumpStrength;
            }
            else if (!this.doubleJumpUsed) {
                this.velocityY = this.jumpStrength;
                this.doubleJumpUsed = true;
            }
        }

        if (!this.onFloor && !this.onPlatform) {
            this.velocityY += this.gravity;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.onFloor = true;
            this.doubleJumpUsed = false;
        }
        else {
            this.onFloor = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Border {
    constructor() {
        this.xMin = 0;
        this.yMin = 0;

        this.xMax = canvas.width;
        this.yMax = canvas.height;
    }

    checkCollision(target) {

        if (target.x < this.xMin) {
            target.x = this.xMin;
        }

        if (target.y < this.yMin) {
            target.y = this.yMin;
            target.velocityY = 0;
        }

        if (target.x + target.width > this.xMax) {
            target.x = this.xMax - target.width;
        }

        if (target.y + target.height > this.yMax) {
            target.y = this.yMax - target.height;
            target.velocityY = 0;
            target.onFloor = true;
        }
    }
}

function resolveCollision(a, b) {

    if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    ) {

        const overlapTop =
            a.y + a.height - b.y;

        const overlapBottom =
            b.y + b.height - a.y;

        const overlapLeft =
            a.x + a.width - b.x;

        const overlapRight =
            b.x + b.width - a.x;

        const minOverlap = Math.min(
            overlapTop,
            overlapBottom,
            overlapLeft,
            overlapRight
        );

        if (minOverlap === overlapTop) {

            a.y -= overlapTop / 2;
            b.y += overlapTop / 2;

            a.velocityY = 0;
            b.velocityY = 0;

            a.onFloor = true;
            a.doubleJumpUsed = false;
        }

        else if (minOverlap === overlapBottom) {

            a.y += overlapBottom / 2;
            b.y -= overlapBottom / 2;

            a.velocityY = 0;
            b.velocityY = 0;

            b.onFloor = true;
            b.doubleJumpUsed = false;
        }

        else if (minOverlap === overlapLeft) {

            a.x -= overlapLeft / 2;
            b.x += overlapLeft / 2;
        }

        else if (minOverlap === overlapRight) {

            a.x += overlapRight / 2;
            b.x -= overlapRight / 2;
        }
    }
}

class Block {
    constructor(x, y, width, height, color, type) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
    }

    collisions(target) {
        return (
            target.x < this.x + this.width &&
            target.x + target.width > this.x &&
            target.y < this.y + this.height &&
            target.y + target.height > this.y
        );
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function BlockCollisions(block, target) {
    if (!block.collisions(target)) return;

    // Only resolve collisions by moving the player (block is immovable)
    const overlapTop = target.y + target.height - block.y;
    const overlapBottom = block.y + block.height - target.y;
    const overlapLeft = target.x + target.width - block.x;
    const overlapRight = block.x + block.width - target.x;

    const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

    if (minOverlap === overlapTop) {
        // player landed on top of block
        target.y -= overlapTop;
        target.velocityY = 0;
        target.onPlatform = true;
        target.onFloor = true;
        target.doubleJumpUsed = false;
    }
    else if (minOverlap === overlapBottom) {
        // player hit block from below
        target.y += overlapBottom;
        target.velocityY = 0;
    }
    else if (minOverlap === overlapLeft) {
        // player hit block from left
        target.x -= overlapLeft;
    }
    else if (minOverlap === overlapRight) {
        // player hit block from right
        target.x += overlapRight;
    }
}

class Data {
    constructor() {

        this.player = new Player(
            canvas.width / 2,
            canvas.height / 2,
            50,
            50,
            'w',
            's',
            'a',
            'd',
            'lime'
        );

        this.player2 = new Player(
            canvas.width / 2 - 100,
            canvas.height / 2,
            50,
            50,
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'orange'
        );

        this.block = new Block(500, canvas.height - 200, 100, 50, 'red', 'normal');

        this.border = new Border();
    }
}

const data = new Data();

function GameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Player.getAll().forEach(p => p.update());
    // reset platform state; collisions will set it when appropriate
    Player.getAll().forEach(p => p.onPlatform = false);
    Player.getAll().forEach(p => BlockCollisions(data.block, p));

    resolveCollision(data.player, data.player2);

    Player.getAll().forEach(p => {
        data.border.checkCollision(p);
    });

    data.block.draw(ctx);

    Player.getAll().forEach(p => p.draw(ctx));

    previousKeys = { ...keys };

    requestAnimationFrame(GameLoop);
}

GameLoop();