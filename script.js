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
        this.jumpRequest = false;

        this.prevX = this.x;
        this.prevY = this.y;

        Player.all.push(this);
    }

    static getAll() {
        return Player.all;
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;

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
            this.jumpRequest = true;
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
        else if (this.onPlatform){
            this.onFloor = true;
            this.doubleJumpUsed = false;
        } else {
            this.onFloor = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    processJump() {
        if (!this.jumpRequest) return;

        if (this.onFloor || this.onPlatform) {
            this.velocityY = this.jumpStrength;
            this.jumpRequest = false;
            return;
        }

        if (!this.doubleJumpUsed) {
            this.velocityY = this.jumpStrength;
            this.doubleJumpUsed = true;
        }

        this.jumpRequest = false;
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
        const aPrev = {
            left: (a.prevX !== undefined ? a.prevX : a.x),
            top: (a.prevY !== undefined ? a.prevY : a.y),
            right: (a.prevX !== undefined ? a.prevX + a.width : a.x + a.width),
            bottom: (a.prevY !== undefined ? a.prevY + a.height : a.y + a.height)
        };

        const bPrev = {
            left: (b.prevX !== undefined ? b.prevX : b.x),
            top: (b.prevY !== undefined ? b.prevY : b.y),
            right: (b.prevX !== undefined ? b.prevX + b.width : b.x + b.width),
            bottom: (b.prevY !== undefined ? b.prevY + b.height : b.y + b.height)
        };

        if (aPrev.bottom <= bPrev.top) {
            a.y = b.y - a.height;
            a.velocityY = 0;
            a.onFloor = true;
            a.doubleJumpUsed = false;
            return;
        }

        if (bPrev.bottom <= aPrev.top) {
            b.y = a.y - b.height;
            b.velocityY = 0;
            b.onFloor = true;
            b.doubleJumpUsed = false;
            return;
        }

        if (aPrev.right <= bPrev.left) {
            const overlap = a.x + a.width - b.x;
            if (overlap > 0) {
                const mover = Math.abs(a.velocityX) >= Math.abs(b.velocityX) ? a : b;
                const other = mover === a ? b : a;

                if (Math.abs(mover.velocityX) > 0) {
                    if (mover === a) {
                        other.x += overlap;
                    } else {
                        other.x -= overlap;
                    }
                    other.velocityX = mover.velocityX * 0.8;
                    mover.velocityX *= 0.2;
                } else {
                    a.x -= overlap / 2;
                    b.x += overlap / 2;
                }
            }
            return;
        }

        if (bPrev.right <= aPrev.left) {
            const overlap = b.x + b.width - a.x;
            if (overlap > 0) {
                const mover = Math.abs(b.velocityX) >= Math.abs(a.velocityX) ? b : a;
                const other = mover === b ? a : b;

                if (Math.abs(mover.velocityX) > 0) {
                    if (mover === b) {
                        other.x += overlap;
                    } else {
                        other.x -= overlap;
                    }
                    other.velocityX = mover.velocityX * 0.8;
                    mover.velocityX *= 0.2;
                } else {
                    b.x -= overlap / 2;
                    a.x += overlap / 2;
                }
            }
            return;
        }

        const overlapTop = a.y + a.height - b.y;
        const overlapBottom = b.y + b.height - a.y;
        const overlapLeft = a.x + a.width - b.x;
        const overlapRight = b.x + b.width - a.x;

        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

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
    static all = [];
    constructor(x, y, width, height, color, type) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        Block.all.push(this);
    }

    collisions(target) {
        return (
            target.x < this.x + this.width &&
            target.x + target.width > this.x &&
            target.y < this.y + this.height &&
            target.y + target.height > this.y
        );
    }
    static getAll() {
        return Block.all;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function BlockCollisions(block, target) {
    if (!block.collisions(target)) return;
    const prevBottom = target.prevY + target.height;
    const prevTop = target.prevY;
    const prevRight = target.prevX + target.width;
    const prevLeft = target.prevX;

    if (prevBottom <= block.y) {
        target.y = block.y - target.height;
        target.onFloor = true;
        target.onPlatform = true;
        target.doubleJumpUsed = false;
        target.velocityY = 0;
        return;
    }

    if (prevTop >= block.y + block.height) {
        target.y = block.y + block.height;
        target.velocityY = 0;
        return;
    }

    if (prevRight <= block.x) {
        target.x = block.x - target.width;
        return;
    }

    if (prevLeft >= block.x + block.width) {
        target.x = block.x + block.width;
        return;
    }

    const overlapTop = target.y + target.height - block.y;
    const overlapBottom = block.y + block.height - target.y;
    const overlapLeft = target.x + target.width - block.x;
    const overlapRight = block.x + block.width - target.x;

    const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

    if (minOverlap === overlapTop) {
        target.y -= overlapTop;
        target.onFloor = true;
        target.onPlatform = true;
        target.doubleJumpUsed = false;
        target.velocityY = 0;
    }
    else if (minOverlap === overlapBottom) {
        target.y += overlapBottom;
        target.velocityY = 0;
    }
    else if (minOverlap === overlapLeft) {
        target.x -= overlapLeft;
    }
    else if (minOverlap === overlapRight) {
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

        this.block = new Block(0, canvas.height - 200, 500, 50, 'red', 'normal');

        this.block2 = new Block(canvas.width - 500, canvas.height - 200, 500, 50, 'blue', 'normal');

        this.border = new Border();
    }
}

const data = new Data();

function GameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Player.getAll().forEach(p => p.update());
    Player.getAll().forEach(p => p.onPlatform = false);
    Block.getAll().forEach(b => {
        Player.getAll().forEach(p => BlockCollisions(b, p));
    });

    resolveCollision(data.player, data.player2);

    Player.getAll().forEach(p => {
        data.border.checkCollision(p);
    });

    Player.getAll().forEach(p => p.processJump());

    Block.getAll().forEach(b => b.draw(ctx));

    Player.getAll().forEach(p => p.draw(ctx));

    previousKeys = { ...keys };

    requestAnimationFrame(GameLoop);
}

GameLoop();