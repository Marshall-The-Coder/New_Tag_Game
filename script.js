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

        this.velocityY += this.gravity;

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
            this.doubleJumpUsed = false;
        }

        else if (minOverlap === overlapBottom) {

            a.y += overlapBottom / 2;
            b.y -= overlapBottom / 2;

            a.velocityY = 0;
            b.velocityY = 0;
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

        this.border = new Border();
    }
}

const data = new Data();

function GameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.player.update();
    data.player2.update();

    resolveCollision(data.player, data.player2);

    data.border.checkCollision(data.player);
    data.border.checkCollision(data.player2);

    data.player.draw(ctx);
    data.player2.draw(ctx);

    previousKeys = { ...keys };

    requestAnimationFrame(GameLoop);
}

GameLoop();