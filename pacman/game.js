// ============================================================
// PAC-MAN Game
// ============================================================

(function () {
    "use strict";

    // ---- Constants ------------------------------------------
    const TILE = 20;
    const COLS = 28;
    const ROWS = 31;
    const CANVAS_W = COLS * TILE;
    const CANVAS_H = ROWS * TILE;

    const DIR = {
        NONE:  { x:  0, y:  0 },
        LEFT:  { x: -1, y:  0 },
        RIGHT: { x:  1, y:  0 },
        UP:    { x:  0, y: -1 },
        DOWN:  { x:  0, y:  1 },
    };

    // Map legend:
    // 1 = wall, 0 = dot, 2 = empty, 3 = power pellet,
    // 4 = ghost house wall, 5 = ghost house gate, 6 = ghost house interior
    const MAP = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
        [1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1],
        [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
        [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
        [2,2,2,2,2,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,2,2,2,2,2],
        [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
        [2,2,2,2,2,1,0,1,1,2,1,1,1,5,5,1,1,1,2,1,1,0,1,2,2,2,2,2],
        [1,1,1,1,1,1,0,1,1,2,1,6,6,6,6,6,6,1,2,1,1,0,1,1,1,1,1,1],
        [2,2,2,2,2,2,0,2,2,2,1,6,6,6,6,6,6,1,2,2,2,0,2,2,2,2,2,2],
        [1,1,1,1,1,1,0,1,1,2,1,6,6,6,6,6,6,1,2,1,1,0,1,1,1,1,1,1],
        [2,2,2,2,2,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,2,2,2,2,2],
        [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
        [2,2,2,2,2,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,2,2,2,2,2],
        [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
        [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
        [1,3,0,0,1,1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1,1,0,0,3,1],
        [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
        [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    // ---- DOM refs -------------------------------------------
    const canvas  = document.getElementById("game-canvas");
    const ctx     = canvas.getContext("2d");
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    const scoreEl     = document.getElementById("score");
    const highScoreEl = document.getElementById("high-score");
    const livesEl     = document.getElementById("lives");
    const startScreen = document.getElementById("start-screen");
    const gameOverScreen = document.getElementById("game-over-screen");
    const endTitle    = document.getElementById("end-title");
    const finalScore  = document.getElementById("final-score-text");
    const startBtn    = document.getElementById("start-btn");
    const restartBtn  = document.getElementById("restart-btn");

    // ---- Game state -----------------------------------------
    let map, score, lives, highScore, totalDots, dotsEaten;
    let pacman, ghosts;
    let gameRunning, gamePaused, animFrame;
    let frightTimer, frightDuration;
    let mouthAngle, mouthDir;
    let lastTime;

    highScore = parseInt(localStorage.getItem("pacman-high") || "0", 10);
    highScoreEl.textContent = highScore;

    // ---- Helpers --------------------------------------------
    function cloneMap() {
        return MAP.map(r => r.slice());
    }

    function isWall(col, row) {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false; // tunnel
        const t = map[row][col];
        return t === 1 || t === 4;
    }

    function isGhostHouse(col, row) {
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
        const t = map[row][col];
        return t === 6 || t === 5;
    }

    function canMove(col, row, isGhost) {
        if (row < 0 || row >= ROWS) return false;
        // tunnel wrapping
        if (col < 0 || col >= COLS) return true;
        const t = map[row][col];
        if (t === 1 || t === 4) return false;
        if (!isGhost && t === 5) return false;
        return true;
    }

    function wrapCol(c) {
        if (c < 0) return COLS - 1;
        if (c >= COLS) return 0;
        return c;
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // ---- Pac-Man object -------------------------------------
    function createPacman() {
        return {
            col: 14,
            row: 23,
            px: 14 * TILE + TILE / 2,
            py: 23 * TILE + TILE / 2,
            dir: DIR.NONE,
            nextDir: DIR.NONE,
            speed: 2,
        };
    }

    // ---- Ghost objects --------------------------------------
    const GHOST_COLORS = ["#ff0000", "#ffb8ff", "#00ffff", "#ffb852"];
    const GHOST_NAMES  = ["Blinky", "Pinky", "Inky", "Clyde"];

    function createGhost(index) {
        const startCols = [13, 14, 11, 16];
        const startRows = [11, 14, 14, 14];
        const col = startCols[index];
        const row = startRows[index];
        return {
            col,
            row,
            px: col * TILE + TILE / 2,
            py: row * TILE + TILE / 2,
            dir: DIR.NONE,
            color: GHOST_COLORS[index],
            name: GHOST_NAMES[index],
            speed: 1.5,
            frightened: false,
            eaten: false,
            inHouse: index !== 0,
            releaseTimer: index * 3000,
            scatterTarget: [
                { col: COLS - 3, row: 0 },
                { col: 2, row: 0 },
                { col: COLS - 1, row: ROWS - 1 },
                { col: 0, row: ROWS - 1 },
            ][index],
        };
    }

    // ---- Ghost AI -------------------------------------------
    function getGhostTarget(ghost, index) {
        if (ghost.eaten) {
            return { col: 13, row: 14 }; // return to house
        }
        if (ghost.frightened) {
            return { col: Math.floor(Math.random() * COLS), row: Math.floor(Math.random() * ROWS) };
        }

        // Chase mode targets
        switch (index) {
            case 0: // Blinky - targets pacman directly
                return { col: pacman.col, row: pacman.row };
            case 1: { // Pinky - targets 4 tiles ahead of pacman
                let tc = pacman.col + pacman.dir.x * 4;
                let tr = pacman.row + pacman.dir.y * 4;
                return { col: tc, row: tr };
            }
            case 2: { // Inky - complex: uses Blinky position
                let ahead2c = pacman.col + pacman.dir.x * 2;
                let ahead2r = pacman.row + pacman.dir.y * 2;
                let bc = ghosts[0].col;
                let br = ghosts[0].row;
                return { col: 2 * ahead2c - bc, row: 2 * ahead2r - br };
            }
            case 3: { // Clyde - targets pacman if far, scatter if close
                let d = distance(ghost.col, ghost.row, pacman.col, pacman.row);
                if (d > 8) return { col: pacman.col, row: pacman.row };
                return ghost.scatterTarget;
            }
            default:
                return { col: pacman.col, row: pacman.row };
        }
    }

    function chooseGhostDir(ghost, index) {
        const target = getGhostTarget(ghost, index);
        const possible = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
        const reverse = { x: -ghost.dir.x, y: -ghost.dir.y };

        let bestDir = DIR.NONE;
        let bestDist = Infinity;

        for (const d of possible) {
            // ghosts can't reverse
            if (d.x === reverse.x && d.y === reverse.y) continue;
            const nc = wrapCol(ghost.col + d.x);
            const nr = ghost.row + d.y;

            const passable = ghost.eaten
                ? (nr >= 0 && nr < ROWS && (nc >= 0 && nc < COLS) && map[nr][nc] !== 1 && map[nr][nc] !== 4)
                : canMove(nc, nr, true);

            if (!passable) continue;
            // Ghosts shouldn't re-enter house unless eaten
            if (!ghost.eaten && !ghost.inHouse && isGhostHouse(nc, nr)) continue;

            const dist = distance(nc, nr, target.col, target.row);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = d;
            }
        }
        return bestDir;
    }

    // ---- Initialise -----------------------------------------
    function init() {
        map = cloneMap();
        score = 0;
        lives = 3;
        dotsEaten = 0;
        totalDots = 0;
        frightTimer = 0;
        frightDuration = 7000;
        mouthAngle = 0.25;
        mouthDir = 1;

        // count dots
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (map[r][c] === 0 || map[r][c] === 3) totalDots++;

        pacman = createPacman();
        ghosts = [0, 1, 2, 3].map(createGhost);

        updateUI();
    }

    function updateUI() {
        scoreEl.textContent = score;
        highScoreEl.textContent = highScore;
        let livesStr = "";
        for (let i = 0; i < lives; i++) livesStr += "❤";
        livesEl.textContent = livesStr;
    }

    // ---- Drawing --------------------------------------------
    function drawMap() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const t = map[r][c];
                const x = c * TILE;
                const y = r * TILE;

                if (t === 1 || t === 4) {
                    // wall
                    ctx.fillStyle = "#2121de";
                    ctx.fillRect(x, y, TILE, TILE);
                    // inner darker for depth
                    ctx.fillStyle = "#1919a6";
                    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
                } else if (t === 5) {
                    // ghost gate
                    ctx.fillStyle = "#ffb8ff";
                    ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
                } else {
                    // floor
                    ctx.fillStyle = "#000";
                    ctx.fillRect(x, y, TILE, TILE);

                    if (t === 0) {
                        // dot
                        ctx.fillStyle = "#ffb8ae";
                        ctx.beginPath();
                        ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (t === 3) {
                        // power pellet (blink)
                        if (Math.floor(Date.now() / 250) % 2 === 0) {
                            ctx.fillStyle = "#ffb8ae";
                            ctx.beginPath();
                            ctx.arc(x + TILE / 2, y + TILE / 2, 6, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }
        }
    }

    function drawPacman() {
        const { px, py, dir } = pacman;
        let angle = 0;
        if (dir === DIR.RIGHT) angle = 0;
        else if (dir === DIR.DOWN) angle = Math.PI / 2;
        else if (dir === DIR.LEFT) angle = Math.PI;
        else if (dir === DIR.UP) angle = -Math.PI / 2;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);

        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(0, 0, TILE / 2 - 1, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawGhost(ghost) {
        const { px, py, frightened, eaten, color } = ghost;
        const r = TILE / 2 - 1;

        if (eaten) {
            // draw only eyes
            drawGhostEyes(px, py, ghost.dir);
            return;
        }

        ctx.fillStyle = frightened ? (Math.floor(Date.now() / 200) % 2 === 0 && frightTimer < 2000 ? "#fff" : "#2121de") : color;

        // body
        ctx.beginPath();
        ctx.arc(px, py - 2, r, Math.PI, 0, false);
        ctx.lineTo(px + r, py + r - 2);
        // wavy bottom
        const wave = 3;
        for (let i = 0; i < 3; i++) {
            const segW = (2 * r) / 3;
            const sx = px + r - i * segW;
            ctx.quadraticCurveTo(sx - segW / 4, py + r - 2 + wave, sx - segW / 2, py + r - 2);
            ctx.quadraticCurveTo(sx - (3 * segW) / 4, py + r - 2 - wave, sx - segW, py + r - 2);
        }
        ctx.closePath();
        ctx.fill();

        // eyes
        if (frightened) {
            // simple frightened face
            ctx.fillStyle = "#fff";
            ctx.fillRect(px - 4, py - 4, 3, 3);
            ctx.fillRect(px + 2, py - 4, 3, 3);
            // mouth
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 5, py + 3);
            for (let i = 0; i < 4; i++) {
                ctx.lineTo(px - 5 + i * 3 + 1.5, py + (i % 2 === 0 ? 5 : 2));
            }
            ctx.stroke();
        } else {
            drawGhostEyes(px, py, ghost.dir);
        }
    }

    function drawGhostEyes(px, py, dir) {
        // whites
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(px - 4, py - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 4, py - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // pupils direction
        let ox = 0, oy = 0;
        if (dir === DIR.LEFT) ox = -2;
        else if (dir === DIR.RIGHT) ox = 2;
        else if (dir === DIR.UP) oy = -2;
        else if (dir === DIR.DOWN) oy = 2;

        ctx.fillStyle = "#2121de";
        ctx.beginPath();
        ctx.arc(px - 4 + ox, py - 3 + oy, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 4 + ox, py - 3 + oy, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- Movement -------------------------------------------
    function movePacman() {
        // Try to turn in the next requested direction
        if (pacman.nextDir !== DIR.NONE) {
            const nc = wrapCol(pacman.col + pacman.nextDir.x);
            const nr = pacman.row + pacman.nextDir.y;
            if (canMove(nc, nr, false)) {
                pacman.dir = pacman.nextDir;
            }
        }

        if (pacman.dir === DIR.NONE) return;

        const targetCol = wrapCol(pacman.col + pacman.dir.x);
        const targetRow = pacman.row + pacman.dir.y;

        if (!canMove(targetCol, targetRow, false)) {
            // snap to grid center
            pacman.px = pacman.col * TILE + TILE / 2;
            pacman.py = pacman.row * TILE + TILE / 2;
            return;
        }

        const targetPx = targetCol * TILE + TILE / 2;
        const targetPy = targetRow * TILE + TILE / 2;

        // Handle tunnel wrap pixel position
        let dx = targetPx - pacman.px;
        let dy = targetPy - pacman.py;

        if (Math.abs(dx) > CANVAS_W / 2) {
            // tunnel wrap
            dx = dx > 0 ? dx - CANVAS_W : dx + CANVAS_W;
        }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= pacman.speed) {
            pacman.px = targetPx;
            pacman.py = targetPy;
            pacman.col = targetCol;
            pacman.row = targetRow;
        } else {
            pacman.px += (dx / dist) * pacman.speed;
            pacman.py += (dy / dist) * pacman.speed;

            // update grid position when crossing tile center
            const newCol = Math.floor(pacman.px / TILE);
            const newRow = Math.floor(pacman.py / TILE);
            if (newCol >= 0 && newCol < COLS) pacman.col = newCol;
            if (newRow >= 0 && newRow < ROWS) pacman.row = newRow;
        }

        // tunnel wrap px
        if (pacman.px < -TILE / 2) pacman.px += CANVAS_W;
        if (pacman.px > CANVAS_W + TILE / 2) pacman.px -= CANVAS_W;
    }

    function moveGhost(ghost, index) {
        // Release from house
        if (ghost.inHouse) {
            ghost.releaseTimer -= 16;
            if (ghost.releaseTimer <= 0) {
                ghost.inHouse = false;
                ghost.col = 13;
                ghost.row = 11;
                ghost.px = ghost.col * TILE + TILE / 2;
                ghost.py = ghost.row * TILE + TILE / 2;
                ghost.dir = DIR.LEFT;
            }
            return;
        }

        // At tile center, choose new direction
        const cx = ghost.col * TILE + TILE / 2;
        const cy = ghost.row * TILE + TILE / 2;
        const atCenter = Math.abs(ghost.px - cx) < ghost.speed + 0.5 && Math.abs(ghost.py - cy) < ghost.speed + 0.5;

        if (atCenter) {
            ghost.px = cx;
            ghost.py = cy;
            ghost.dir = chooseGhostDir(ghost, index);
        }

        if (ghost.dir === DIR.NONE) {
            ghost.dir = chooseGhostDir(ghost, index);
            if (ghost.dir === DIR.NONE) return;
        }

        const spd = ghost.eaten ? 3 : (ghost.frightened ? 1 : ghost.speed);
        ghost.px += ghost.dir.x * spd;
        ghost.py += ghost.dir.y * spd;

        // update grid pos
        ghost.col = Math.round((ghost.px - TILE / 2) / TILE);
        ghost.row = Math.round((ghost.py - TILE / 2) / TILE);
        ghost.col = wrapCol(ghost.col);

        // tunnel wrap
        if (ghost.px < -TILE / 2) ghost.px += CANVAS_W;
        if (ghost.px > CANVAS_W + TILE / 2) ghost.px -= CANVAS_W;

        // Check if eaten ghost returned to house
        if (ghost.eaten && ghost.row === 14 && Math.abs(ghost.col - 13) <= 1) {
            ghost.eaten = false;
            ghost.frightened = false;
            ghost.dir = DIR.NONE;
        }
    }

    // ---- Collisions -----------------------------------------
    function checkDots() {
        const { col, row } = pacman;
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        const t = map[row][col];

        if (t === 0) {
            map[row][col] = 2;
            score += 10;
            dotsEaten++;
        } else if (t === 3) {
            map[row][col] = 2;
            score += 50;
            dotsEaten++;
            activateFright();
        }

        if (dotsEaten >= totalDots) {
            winGame();
        }
    }

    function activateFright() {
        frightTimer = frightDuration;
        for (const g of ghosts) {
            if (!g.eaten && !g.inHouse) {
                g.frightened = true;
                // reverse direction
                g.dir = { x: -g.dir.x, y: -g.dir.y };
            }
        }
    }

    function checkGhostCollision() {
        for (const g of ghosts) {
            if (g.inHouse || g.eaten) continue;
            const d = distance(pacman.px, pacman.py, g.px, g.py);
            if (d < TILE - 2) {
                if (g.frightened) {
                    // eat ghost
                    g.eaten = true;
                    g.frightened = false;
                    score += 200;
                } else {
                    loseLife();
                    return;
                }
            }
        }
    }

    function loseLife() {
        lives--;
        updateUI();
        if (lives <= 0) {
            endGame(false);
        } else {
            // reset positions
            pacman = createPacman();
            ghosts = [0, 1, 2, 3].map(createGhost);
        }
    }

    function winGame() {
        endGame(true);
    }

    function endGame(won) {
        gameRunning = false;
        cancelAnimationFrame(animFrame);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("pacman-high", highScore);
        }
        updateUI();
        endTitle.textContent = won ? "YOU WIN!" : "GAME OVER";
        finalScore.textContent = "Score: " + score;
        gameOverScreen.classList.remove("hidden");
    }

    // ---- Game loop ------------------------------------------
    function gameLoop(timestamp) {
        if (!gameRunning) return;
        if (gamePaused) {
            animFrame = requestAnimationFrame(gameLoop);
            return;
        }

        const dt = timestamp - (lastTime || timestamp);
        lastTime = timestamp;

        // fright timer
        if (frightTimer > 0) {
            frightTimer -= dt;
            if (frightTimer <= 0) {
                frightTimer = 0;
                for (const g of ghosts) g.frightened = false;
            }
        }

        // mouth animation
        mouthAngle += 0.02 * mouthDir;
        if (mouthAngle > 0.3) mouthDir = -1;
        if (mouthAngle < 0.02) mouthDir = 1;

        movePacman();
        checkDots();
        for (let i = 0; i < ghosts.length; i++) moveGhost(ghosts[i], i);
        checkGhostCollision();
        updateUI();

        // draw
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawMap();
        drawPacman();
        for (const g of ghosts) drawGhost(g);

        animFrame = requestAnimationFrame(gameLoop);
    }

    // ---- Input ----------------------------------------------
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "ArrowLeft":  case "a": case "A":
                pacman.nextDir = DIR.LEFT;  e.preventDefault(); break;
            case "ArrowRight": case "d": case "D":
                pacman.nextDir = DIR.RIGHT; e.preventDefault(); break;
            case "ArrowUp":    case "w": case "W":
                pacman.nextDir = DIR.UP;    e.preventDefault(); break;
            case "ArrowDown":  case "s": case "S":
                pacman.nextDir = DIR.DOWN;  e.preventDefault(); break;
            case "p": case "P":
                if (gameRunning) gamePaused = !gamePaused;
                break;
        }
    });

    // Touch support for mobile
    let touchStartX, touchStartY;
    canvas.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
        if (touchStartX === undefined) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            pacman.nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
        } else {
            pacman.nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
        }
        e.preventDefault();
    }, { passive: false });

    // ---- Start / Restart ------------------------------------
    function startGame() {
        startScreen.classList.add("hidden");
        gameOverScreen.classList.add("hidden");
        init();
        gameRunning = true;
        gamePaused = false;
        lastTime = null;
        animFrame = requestAnimationFrame(gameLoop);
    }

    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

    // Draw initial idle screen
    init();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap();
    drawPacman();
    for (const g of ghosts) drawGhost(g);

})();
