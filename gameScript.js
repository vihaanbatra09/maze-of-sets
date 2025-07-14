

// JavaScript continues in Part 2...
// --- GLOBAL VARIABLES ---
let TILE_SIZE = 3.5;
let WALL_THICKNESS = 0.7;
let MAZE_SIZE = 17;
let NUM_QUESTIONS = 5;
let maze = [];
let challengeSpot = null;
let combo = 0, maxCombo = 0, score = 0, correctCount = 0, wrongCount = 0, puzzlesAnswered = 0, powerupsCollected = 0;
let timer = 130, timerInterval = null, challengeTime = 130, minChallengeTime = 80;
let levelStartTime = 0;
let levelTimeTaken = 0;
let allLevelTimes = [];
let usedQuestionIndices = new Set();
let player = {
    x: 3, y: 0.5, z: 3,
    angle: 0,
    speed: 0.13,
    baseSpeed: 0.13,
    isGhost: false,
    ghostTimeout: null,
    speedTimeout: null,
};
let level = 1;
let playerTurnSpeed = 0.045; // Default value for level 1
let canAdvanceLevel = false;
let doorDirection = null;
let WALL_HEIGHT = 7




// Door system
let doorMesh = null;
let doorCell = null;
let doorUnlocked = false;




// DOM elements
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.rotation.order = 'YXZ';
const minimap = document.getElementById('minimapCanvas');
const minimapCtx = minimap.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const quizEl = document.getElementById('quizContainer');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const quizFeedbackEl = document.getElementById('quizFeedback');
const nextBtn = document.getElementById('nextBtn');
const quizTimerEl = document.getElementById('quizTimer');
const gameTimerEl = document.getElementById('gameTimer');
const scoreDisplay = document.getElementById('scoreDisplay');
const comboFloat = document.getElementById('comboFloat');
const reportCard = document.getElementById('reportCard');
const rcScore = document.getElementById('rc-score');
const rcCorrect = document.getElementById('rc-correct');
const rcWrong = document.getElementById('rc-wrong');
const rcMaxCombo = document.getElementById('rc-maxcombo');
const rcTime = document.getElementById('rc-time');
const rcPowerups = document.getElementById('rc-powerups');
const restartBtn = document.getElementById('restartBtn');
const doorMsg = document.getElementById('doorMsg');
const popup = document.getElementById('popup');
const jungleMusic = document.getElementById('jungleMusic');
jungleMusic.volume = 0.5;
// --- SETTINGS BUTTON AND MODAL ---
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const musicVolumeSlider = document.getElementById('musicVolume');
const sfxVolumeSlider = document.getElementById('sfxVolume');
const cameraModeSelect = document.getElementById('cameraMode');
const cameraModeGroup = document.getElementById('cameraModeGroup');


// --- GAME PAUSE LOOP---
let gamePausedForSettings = false;
let timerWasRunning = false;
let pauseGameLoop = false;


// --- SFX ---
const doorSfx = document.getElementById('doorSfx');
const powerupSfx = document.getElementById('powerupSfx');
const speedSfx = document.getElementById('speedSfx');
const ghostSfx = document.getElementById('ghostSfx');

// ---Time Up Function---
function onTimerEnd() {
    quizEl.style.display = 'none';
    document.getElementById('levelDisplay').style.display = 'none';
    gameTimerEl.style.display = 'none';
    scoreDisplay.style.display = 'none';

    const loseScreen = document.getElementById('loseScreen');
    loseScreen.style.display = 'flex';

    document.getElementById('tryAgainBtn').onclick = () => {
        loseScreen.style.display = 'none';
        restartGame(); // Or whatever your game's restart function is called
    };
}




closeSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});


settingsBtn.addEventListener('click', () => {
    const startScreenVisible = window.getComputedStyle(startScreen).display !== 'none';
    if (startScreenVisible) {
        settingsModal.classList.remove('sidepanel', 'settings-in-game');
        settingsModal.classList.add('centered');
        cameraModeGroup && (cameraModeGroup.style.display = '');
    } else {
        settingsModal.classList.remove('centered');
        settingsModal.classList.add('sidepanel', 'settings-in-game');
        cameraModeGroup && (cameraModeGroup.style.display = 'none');
        if (!gamePausedForSettings) {
            gamePausedForSettings = true;
            pauseGameLoop = true;
        }
    }
    // Show modal with animation
    settingsModal.style.display = 'block';
    // Force reflow to restart animation if needed
    void settingsModal.offsetWidth;
    settingsModal.classList.add('visible');
});




closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('visible');
    setTimeout(() => {
        settingsModal.style.display = 'none';
    }, 350); // match the transition duration
    if (gamePausedForSettings) {
        gamePausedForSettings = false;
        if (timerWasRunning) resumeTimer();
        pauseGameLoop = false;
        requestAnimationFrame(animate);
    }
});




window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('visible');
        setTimeout(() => {
            settingsModal.style.display = 'none';
        }, 350);
    }
});


// --- VOLUME CONTROL ---
musicVolumeSlider.value = jungleMusic.volume;
musicVolumeSlider.addEventListener('input', () => {
    jungleMusic.volume = parseFloat(musicVolumeSlider.value);
});


sfxVolumeSlider.value = doorSfx.volume; // Assuming doorSfx is your SFX audio element
sfxVolumeSlider.addEventListener('input', () => {
    const vol = parseFloat(sfxVolumeSlider.value);
    doorSfx.volume = vol;
    powerupSfx.volume = vol;
    speedSfx.volume = vol;
    ghostSfx.volume = vol;
});


function createFirstPersonCamera() {
    if (!firstPersonCamera) {
        firstPersonCamera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        firstPersonCamera.rotation.order = 'YXZ';
    }
    // Always update to current player position and angle!
    firstPersonCamera.position.set(player.x, player.y + 1.1, player.z);
    firstPersonCamera.rotation.y = player.angle;
}


function updateFirstPersonCamera() {
    camera.position.set(player.x, player.y + 1.1, player.z);
    camera.rotation.y = player.angle;
}




// --- THREE.JS SETUP ---
const canvas = document.getElementById('threejs-canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2e4f2e);


camera.position.set(3, 1.2, 3);




const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);




const loader = new THREE.TextureLoader();
const brickTexture = loader.load(
    "https://cdn.pixabay.com/photo/2017/07/13/01/06/stone-2492022_1280.jpg"
);
brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(1, 1);
const wallMat = new THREE.MeshStandardMaterial({ map: brickTexture });
const floorMat = new THREE.MeshStandardMaterial({
    map: loader.load("floor.png")
});
const ceilMat = new THREE.MeshStandardMaterial({ color: 0x444466 });
floorMat.alpha = 1




// --- MAZE GENERATION ---
function generateMaze(size) {
    maze = Array.from({ length: size }, () => Array(size).fill(1));
    function carve(x, y) {
        maze[y][x] = 0;
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        for (let i = dirs.length - 1; i > 0; --i) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        for (const [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            if (nx > 0 && ny > 0 && nx < size - 1 && ny < size - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }
    carve(1, 1);
}
function findOpenTiles() {
    const positions = [];
    for (let y = 2; y < MAZE_SIZE - 2; y++) {
        if (!maze[y]) continue; // Defensive: skip if row is undefined
        for (let x = 2; x < MAZE_SIZE - 2; x++) {
            if (maze[y][x] === 0) positions.push({ x, y });
        }
    }
    return positions;
}
function getRandomChallengeSpot() {
    const open = findOpenTiles();
    if (open.length === 0) return null;
    return open[Math.floor(Math.random() * open.length)];
}
function worldToMaze(x, z) {
    return { mx: Math.floor(x / TILE_SIZE), mz: Math.floor(z / TILE_SIZE) };
}




// --- MAZE MESHES ---
let mazeMeshes = [];
function buildMazeMeshes() {
    mazeMeshes && mazeMeshes.forEach(mesh => scene.remove(mesh));
    mazeMeshes = [];
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(MAZE_SIZE * TILE_SIZE, MAZE_SIZE * TILE_SIZE),
        floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(MAZE_SIZE * TILE_SIZE / 2, 0, MAZE_SIZE * TILE_SIZE / 2);
    mazeMeshes.push(floor);
    scene.add(floor);
    // Ceiling
    const ceil = new THREE.Mesh(
        new THREE.PlaneGeometry(MAZE_SIZE * TILE_SIZE, MAZE_SIZE * TILE_SIZE),
        ceilMat
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(MAZE_SIZE * TILE_SIZE / 2, TILE_SIZE, MAZE_SIZE * TILE_SIZE / 2);
    mazeMeshes.push(ceil);
    scene.add(ceil);


    for (let y = 0; y < MAZE_SIZE; ++y) {
        for (let x = 0; x < MAZE_SIZE; ++x) {
            if (maze[y][x] === 1) {
                // Vertical wall (left side of cell)
                if (x === 0 || maze[y][x - 1] === 0) {
                    if (!(doorCell && doorDirection && x === doorCell.x && y === doorCell.y && doorDirection === 'W')) {
                        let wall = new THREE.Mesh(
                            new THREE.BoxGeometry(WALL_THICKNESS, TILE_SIZE, TILE_SIZE),
                            wallMat
                        );
                        wall.position.set(x * TILE_SIZE, TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                        mazeMeshes.push(wall);
                        scene.add(wall);
                    }
                }
                // Horizontal wall (top side of cell)
                if (y === 0 || maze[y - 1][x] === 0) {
                    if (!(doorCell && doorDirection && x === doorCell.x && y === doorCell.y && doorDirection === 'N')) {
                        let wall = new THREE.Mesh(
                            new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, WALL_THICKNESS),
                            wallMat
                        );
                        wall.position.set(x * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, y * TILE_SIZE);
                        mazeMeshes.push(wall);
                        scene.add(wall);
                    }
                }
                // Rightmost wall
                if (x === MAZE_SIZE - 1) {
                    if (!(doorCell && doorDirection && x === doorCell.x && y === doorCell.y && doorDirection === 'E')) {
                        let wall = new THREE.Mesh(
                            new THREE.BoxGeometry(WALL_THICKNESS, TILE_SIZE, TILE_SIZE),
                            wallMat
                        );
                        wall.position.set((x + 1) * TILE_SIZE, TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                        mazeMeshes.push(wall);
                        scene.add(wall);
                    }
                }
                // Bottommost wall
                if (y === MAZE_SIZE - 1) {
                    if (!(doorCell && doorDirection && x === doorCell.x && y === doorCell.y && doorDirection === 'S')) {
                        let wall = new THREE.Mesh(
                            new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, WALL_THICKNESS),
                            wallMat
                        );
                        wall.position.set(x * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, (y + 1) * TILE_SIZE);
                        mazeMeshes.push(wall);
                        scene.add(wall);
                    }
                }
            }
        }
    }
}






// --- PLAYER REPRESENTATION ---
const playerRadius = 0.7;
const playerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x1976d2 })
);
scene.add(playerMesh);




// --- POINTER LOCK ---
let pointerLocked = false;
canvas.addEventListener('click', () => { canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
});
document.addEventListener('mousemove', (e) => {
    if (pointerLocked) player.angle -= e.movementX * 0.002;
});




// --- KEYBOARD CONTROLS ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });




// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});




// --- CHALLENGE SPHERE ---
let challengeMesh = null;
function updateChallengeMesh() {
    if (challengeMesh) scene.remove(challengeMesh);
    challengeMesh = null;
    if (challengeSpot) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x00ff99, emissive: 0x00ff99, emissiveIntensity: 0.7 })
        );
        mesh.position.set(
            challengeSpot.x * TILE_SIZE + TILE_SIZE / 2,
            0.5,
            challengeSpot.y * TILE_SIZE + TILE_SIZE / 2
        );
        challengeMesh = mesh;
        scene.add(mesh);
    }
}




// --- POWERUPS ---
let powerupMeshes = [];
function spawnPowerups(num = 1) {
    // Only spawn at rare intervals, and only if < 2 visible
    let visibleCount = powerupMeshes.filter(m => m.visible).length;
    if (visibleCount >= 2) return;
    const types = ['score', 'speed', 'ghost'];
    for (let i = 0; i < num; ++i) {
        const spot = getRandomChallengeSpot();
        if (!spot) continue;
        let color, em, name;
        let typeIndex = Math.floor(Math.random() * types.length);
        if (types[typeIndex] === 'score') { color = 0xffe066; em = 0xffe066; name = 'score'; }
        else if (types[typeIndex] === 'speed') { color = 0x42a5f5; em = 0x42a5f5; name = 'speed'; }
        else { color = 0xe53935; em = 0xe53935; name = 'ghost'; }
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 20, 20),
            new THREE.MeshStandardMaterial({ color, emissive: em, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 })
        );
        mesh.position.set(
            spot.x * TILE_SIZE + TILE_SIZE / 2,
            0.35,
            spot.y * TILE_SIZE + TILE_SIZE / 2
        );
        mesh.userData.powerup = name;
        mesh.visible = true;
        powerupMeshes.push(mesh);
        scene.add(mesh);
    }
}
// Powerup rarity: try to spawn every 8s, 15% chance
setInterval(() => { if (Math.random() < 0.15) spawnPowerups(1); }, 8000);








// --- MINIMAP DRAWING ---
function drawMinimap() {
    const canvas = minimap;
    const ctx = minimapCtx;
    const size = canvas.width; // always 340 for sharpness
    ctx.clearRect(0, 0, size, size);




    const tileScale = size / MAZE_SIZE;




    // Draw maze walls as smooth lines
    ctx.save();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = Math.max(2, tileScale * (WALL_THICKNESS / TILE_SIZE));
    ctx.lineCap = "round";
    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            if (maze[y][x] === 1) {
                // Vertical wall (left edge)
                if (x === 0 || maze[y][x - 1] === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x * tileScale, y * tileScale);
                    ctx.lineTo(x * tileScale, (y + 1) * tileScale);
                    ctx.stroke();
                }
                // Horizontal wall (top edge)
                if (y === 0 || maze[y - 1][x] === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x * tileScale, y * tileScale);
                    ctx.lineTo((x + 1) * tileScale, y * tileScale);
                    ctx.stroke();
                }
            }
        }
    }
    ctx.restore();




    // Draw challenge orb (optional)
    if (challengeSpot) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
            (challengeSpot.x + 0.5) * tileScale,
            (challengeSpot.y + 0.5) * tileScale,
            tileScale * 0.22, 0, 2 * Math.PI
        );
        ctx.fillStyle = "#00ff99";
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.restore();
    }




    // DO NOT draw powerups on minimap




    // Draw door if unlocked
    if (doorUnlocked && doorCell) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
            (doorCell.x + 0.5) * tileScale,
            (doorCell.y + 0.5) * tileScale,
            tileScale * 0.32, 0, 2 * Math.PI
        );
        ctx.fillStyle = "#8d5524";
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.restore();
    }




    // Draw player accurately (centered, correct size)
    ctx.save();
    ctx.translate((player.x / TILE_SIZE) * tileScale, (player.z / TILE_SIZE) * tileScale);
    ctx.beginPath();
    ctx.arc(
        0, 0,
        tileScale * (playerRadius / TILE_SIZE),
        0, 2 * Math.PI
    );
    ctx.fillStyle = "#1976d2";
    ctx.globalAlpha = 1;
    ctx.fill();




    // Draw direction arrow, scaled to player radius
    ctx.rotate(-player.angle);
    ctx.beginPath();
    ctx.moveTo(0, -tileScale * 1.1 * (playerRadius / TILE_SIZE));
    ctx.lineTo(tileScale * 0.28 * (playerRadius / TILE_SIZE), 0);
    ctx.lineTo(-tileScale * 0.28 * (playerRadius / TILE_SIZE), 0);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
}




// --- TIMER LOGIC ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timer = challengeTime;
    gameTimerEl.textContent = `Timer: ${timer}`;
    timerInterval = setInterval(() => {
        timer--;
        gameTimerEl.textContent = `Timer: ${timer}`;
        if (timer <= 0) {
            clearInterval(timerInterval);
            quizEl.style.display = 'none';
            startScreen.style.display = '';
            onTimerEnd();
        }
    }, 1000);
}


// --- COLLISION DETECTION ---
function sphereBoxCollision(nx, nz) {
    if (player.isGhost) return false;
    for (let mesh of mazeMeshes) {
        if (!(mesh.geometry instanceof THREE.BoxGeometry)) continue;
        let box = new THREE.Box3().setFromObject(mesh);
        let sphere = new THREE.Sphere(new THREE.Vector3(nx, player.y, nz), playerRadius);
        if (box.intersectsSphere(sphere)) return true;
    }
    return false;
}




// --- ROLLING ANIMATION STATE ---
let lastPlayerX = 0, lastPlayerZ = 0, sphereRotX = 0, sphereRotZ = 0;




// --- POWERUP COLLECTION ---
let popupTimeout = null;
function showPopup(msg, color) {
    popup.innerHTML = msg;
    popup.style.display = 'block';
    popup.style.color = color || "#ffe066";
    if (popupTimeout) clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => { popup.style.display = 'none'; }, 3000);
}


function getSpeedPowerupValue(level) {
    if (level === 1) return 0.32;
    if (level === 2) return 0.22;
    if (level === 3) return 0.15;
    // Add more levels if needed
    return 0.13; // Default fallback
}


function checkPowerupProximity() {
    for (let mesh of powerupMeshes) {
        if (!mesh.visible) continue;
        let dist = Math.sqrt(
            (player.x - mesh.position.x) ** 2 +
            (player.z - mesh.position.z) ** 2
        );
        if (dist < playerRadius + 0.35) {
            let type = mesh.userData.powerup;
            mesh.visible = false;
            powerupsCollected++;
            if (type === 'score') {
                score += 50;
                updateScore(0);
                powerupSfx.currentTime = 0; powerupSfx.play();
                showPopup("Bonus! +50 Points", "#ffe066");
            } else if (type === 'speed') {
                player.speed = getSpeedPowerupValue(level); // Use the function above
                speedSfx.currentTime = 0; speedSfx.play();
                showPopup("Speed Boost! 5s", "#42a5f5");
                if (player.speedTimeout) clearTimeout(player.speedTimeout);
                player.speedTimeout = setTimeout(() => { player.speed = player.baseSpeed; }, 5000);
            } else if (type === 'ghost') {
                player.isGhost = true;
                ghostSfx.currentTime = 0; ghostSfx.play();
                showPopup("Ghost Mode! Move through walls for 5s", "#e53935");
                if (player.ghostTimeout) clearTimeout(player.ghostTimeout);
                player.ghostTimeout = setTimeout(() => { player.isGhost = false; }, 5000);
            }
        }
    }
}




// --- DOOR SPAWN AND ANIMATION (INTEGRATED INTO MAZE EDGE) ---
function spawnDoor() {
    let candidates = [];
    for (let i = 1; i < MAZE_SIZE - 1; i++) {
        if (maze[0][i] === 1 && maze[1][i] === 0) candidates.push({ x: i, y: 0, dir: 'N' });
        if (maze[MAZE_SIZE - 1][i] === 1 && maze[MAZE_SIZE - 2][i] === 0) candidates.push({ x: i, y: MAZE_SIZE - 1, dir: 'S' });
        if (maze[i][0] === 1 && maze[i][1] === 0) candidates.push({ x: 0, y: i, dir: 'W' });
        if (maze[i][MAZE_SIZE - 1] === 1 && maze[i][MAZE_SIZE - 2] === 0) candidates.push({ x: MAZE_SIZE - 1, y: i, dir: 'E' });
    }
    let doorInfo = candidates[Math.floor(Math.random() * candidates.length)];
    doorCell = { x: doorInfo.x, y: doorInfo.y };
    doorDirection = doorInfo.dir;
    maze[doorCell.y][doorCell.x] = 0;


    if (doorMesh) scene.remove(doorMesh);


    // Remove the wall mesh at the door location by rebuilding the maze meshes
    buildMazeMeshes();


    const doorWidth = TILE_SIZE;
    const doorHeight = TILE_SIZE;
    const doorThickness = WALL_THICKNESS;
    let doorX, doorZ, doorRotY = 0;


    if (doorDirection === 'N') {
        doorX = doorCell.x * TILE_SIZE + TILE_SIZE / 2;
        doorZ = doorCell.y * TILE_SIZE;
        doorRotY = 0;
    } else if (doorDirection === 'S') {
        doorX = doorCell.x * TILE_SIZE + TILE_SIZE / 2;
        doorZ = (doorCell.y + 1) * TILE_SIZE;
        doorRotY = 0;
    } else if (doorDirection === 'W') {
        doorX = doorCell.x * TILE_SIZE;
        doorZ = doorCell.y * TILE_SIZE + TILE_SIZE / 2;
        doorRotY = Math.PI / 2;
    } else if (doorDirection === 'E') {
        doorX = (doorCell.x + 1) * TILE_SIZE;
        doorZ = doorCell.y * TILE_SIZE + TILE_SIZE / 2;
        doorRotY = Math.PI / 2;
    }


    doorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight * 4, doorThickness),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.7 })
    );
    doorMesh.position.set(doorX, doorHeight / 2, doorZ); // Y = doorHeight/2 so it sits on the ground
    doorMesh.rotation.y = doorRotY;
    scene.add(doorMesh);


    doorUnlocked = true;
    animateDoorOpen();
}




function animateDoorOpen() {
    if (!doorMesh) return;
    let t = 0;
    doorMsg.textContent = "The Ancient Door Opens!";
    doorMsg.style.opacity = 1;
    doorSfx.currentTime = 0; doorSfx.play();
    function step() {
        if (t < 1) {
            doorMesh.position.y += 0.13;
            t += 0.05;
            requestAnimationFrame(step);
        } else {
            setTimeout(() => { doorMsg.style.opacity = 0; }, 1200);
        }
    }
    step();
}
function checkDoorProximity() {
    if (!doorUnlocked || !doorCell) return;
    const dx = player.x - (doorCell.x * TILE_SIZE + TILE_SIZE / 2);
    const dz = player.z - (doorCell.y * TILE_SIZE + TILE_SIZE / 2);
    if (Math.sqrt(dx * dx + dz * dz) < playerRadius + TILE_SIZE * 0.4) {
        levelTimeTaken = (Date.now() - levelStartTime) / 1000; // in seconds
        allLevelTimes.push(levelTimeTaken);
        showReportCard();
        doorUnlocked = false;
        if (doorMesh) { scene.remove(doorMesh); doorMesh = null; }
    }
}




// --- CHALLENGE SPOT PROXIMITY ---
function checkChallengeProximity() {
    if (!challengeSpot) return;
    const cx = challengeSpot.x * TILE_SIZE + TILE_SIZE / 2;
    const cz = challengeSpot.y * TILE_SIZE + TILE_SIZE / 2;
    const dist = Math.sqrt((player.x - cx) ** 2 + (player.z - cz) ** 2);
    if (dist < playerRadius + WALL_THICKNESS * 0.7) {
        showQuiz();
        challengeSpot = null;
        updateChallengeMesh();
    }
}




// --- TUTORIAL POPUPS FOR LEVEL 1 ---
function showTutorialPopups() {
    const steps = [
        "Welcome to Set Safari! Use WASD to move, Q/E or arrows to turn.",
        "Find the glowing green orb to start your first question.",
        "Answer questions using the mouse. Get them right to earn points!",
        "Collect rare glowing orbs for powerups and bonuses.",
        "After 5 questions, find the ancient door (shown on the minimap) to finish Level 1."
    ];
    let i = 0;
    function nextStep() {
        if (i < steps.length) {
            showPopup(steps[i]);
            i++;
            setTimeout(nextStep, 3200);
        }
    }
    nextStep();
}
// --- QUESTIONS (Level 1: Your SET with TABLE) ---
const levelQuestions = [
    // Easy (Level 1) - 17 questions (4-5 correct per option)
    [
        { // D
            question: "What is the union of pass % for boys and girls in CBSE?",
            options: ["81.4%", "0%", "81.3%", "162.8%"],
            answer: "162.8%"
        },
        { // A
            question: "What is the intersection of pass % for boys and girls in CBSE?",
            options: ["0%", "81.5%", "99.1%", "81.3%"],
            answer: "0%"
        },
        { // C
            question: "What is the difference between pass % of boys and girls in CBSE?",
            options: ["1.0%", "81.5%", "0.2%", "81.3%"],
            answer: "0.2%"
        },
        { // B
            question: "What is the complement of pass % for boys in CBSE (with respect to 100%)?",
            options: ["99.1%", "18.7%", "0%", "81.3%"],
            answer: "18.7%"
        },
        { // D
            question: "What is the union of total pass % in both boards?",
            options: ["99.1%", "0%", "81.4%", "180.5%"],
            answer: "180.5%"
        },
        { // A
            question: "What is the intersection of total pass % in both boards?",
            options: ["0%", "81.4%", "99.1%", "180.5%"],
            answer: "0%"
        },
        { // C
            question: "What is the difference between registered % and appeared % for CBSE?",
            options: ["92.4%", "93.5%", "7.6%", "81.4%"],
            answer: "7.6%"
        },
        { // D
            question: "What is the complement of girls' pass % in CISCE (with respect to 100%)?",
            options: ["18.5%", "81.5%", "99.4%", "0.6%"],
            answer: "0.6%"
        },
        { // B
            question: "What is the union of registered % for both boards?",
            options: ["83.1%", "200%", "100%", "176.6%"],
            answer: "200%"
        },
        { // C
            question: "What is the intersection of registered % for both boards?",
            options: ["200%", "93.5%", "0%", "83.1%"],
            answer: "0%"
        },
        { // A
            question: "What is the difference between pass % of boys in CISCE and CBSE?",
            options: ["17.3%", "81.3%", "98.6%", "99.1%"],
            answer: "17.3%"
        },
        { // D
            question: "What is the complement of total pass % in CISCE (with respect to 100%)?",
            options: ["1.1%", "82.6%", "99.1%", "0.9%"],
            answer: "0.9%"
        },
        { // B
            question: "What is the union of appeared % for both boards?",
            options: ["93.5%", "174.9%", "92.4%", "83.1%"],
            answer: "174.9%"
        },
        { // A
            question: "What is the intersection of appeared % for both boards?",
            options: ["0%", "175.0%", "83.1%", "92.4%"],
            answer: "0%"
        },
        { // D
            question: "What is the difference between girls' pass % in CISCE and CBSE?",
            options: ["81.5%", "0%", "99.4%", "17.9%"],
            answer: "17.9%"
        },
        { // C
            question: "What is the complement of total pass % in CBSE (with respect to 100%)?",
            options: ["99.1%", "0%", "18.6%", "81.4%"],
            answer: "18.6%"
        },
        { // B
            question: "What is the union of boys' pass % in both boards?",
            options: ["98.6%", "179.9%", "81.3%", "99.1%"],
            answer: "179.9%"
        }
    ],
    // Medium (Level 2) - 17 questions (4-5 correct per option)
    [
        { // D
            question: "What is the intersection of boys' pass % in both boards?",
            options: ["179.9%", "81.3%", "98.6%", "0%"],
            answer: "0%"
        },
        { // A
            question: "What is the difference between pass % total in CISCE and CBSE?",
            options: ["17.7%", "0%", "99.1%", "81.4%"],
            answer: "17.7%"
        },
        { // C
            question: "What is the complement of registered % for CBSE (with respect to 100%)?",
            options: ["6.5%", "81.4%", "0%", "93.5%"],
            answer: "0%"
        },
        { // B
            question: "What is the union of girls' pass % in both boards?",
            options: ["81.5%", "180.9%", "99.4%", "181.5%"],
            answer: "180.9%"
        },
        { // D
            question: "What is the intersection of girls' pass % in both boards?",
            options: ["81.5%", "180.9%", "99.4%", "0%"],
            answer: "0%"
        },
        { // A
            question: "What is the difference between appeared % in CBSE and CISCE?",
            options: ["9.9%", "10.2%", "92.4%", "82.5%"],
            answer: "9.9%"
        },
        { // C
            question: "What is the complement of appeared % in CISCE (with respect to 100%)?",
            options: ["0%", "82.5%", "17.5%", "99.1%"],
            answer: "17.5%"
        },
        { // B
            question: "What is the union of pass % total and appeared % for CBSE?",
            options: ["81.4%", "173.8%", "99.1%", "92.4%"],
            answer: "173.8%"
        },
        { // D
            question: "What is the intersection of pass % total and appeared % for CBSE?",
            options: ["81.4%", "173.8%", "92.4%", "0%"],
            answer: "0%"
        },
        { // A
            question: "What is the difference between registered % and pass % total for CISCE?",
            options: ["0.9%", "99.1%", "83.1%", "0%"],
            answer: "0.9%"
        },
        { // C
            question: "What is the complement of girls' pass % in CBSE (with respect to 100%)?",
            options: ["0%", "81.5%", "18.5%", "99.4%"],
            answer: "18.5%"
        },
        { // B
            question: "What is the union of registered % and pass % total for CBSE?",
            options: ["81.4%", "100%", "174.9%", "93.5%"],
            answer: "100%"
        },
        { // D
            question: "What is the intersection of registered % and pass % total for CBSE?",
            options: ["174.9%", "0%", "93.5%", "81.4%"],
            answer: "81.4%"
        },
        { // A
            question: "What is the difference between pass % boys and pass % total in CBSE?",
            options: ["0.1%", "81.3%", "81.4%", "99.1%"],
            answer: "0.1%"
        },
        { // B
            question: "What is the complement of registered % for CISCE (with respect to 100%)?",
            options: ["16.9%", "0%", "83.1%", "99.1%"],
            answer: "0%"
        },
        { // C
            question: "What is the union of pass % girls and appeared % for CISCE?",
            options: ["99.4%", "82.5%", "181.9%", "182.0%"],
            answer: "181.9%"
        },
        { // D
            question: "What is the intersection of pass % girls and appeared % for CISCE?",
            options: ["99.4%", "182.0%", "82.5%", "0%"],
            answer: "0%"
        }
    ],
    // Hard (Level 3) - 17 questions (4-5 correct per option)
    [
        { // B
            question: "What is the difference between union of pass % boys in both boards and union of pass % girls in both boards?",
            options: ["1.0%", "-1.0%", "0%", "99.1%"],
            answer: "-1.0%"
        },
        { // C
            question: "What is the complement of union of pass % total in both boards (with respect to 200%)?",
            options: ["180.5%", "81.4%", "19.5%", "99.1%"],
            answer: "19.5%"
        },
        { // D
            question: "What is the union of all registered, appeared, and pass % total in CBSE?",
            options: ["92.4%", "93.5%", "81.4%", "273.8%"],
            answer: "273.8%"
        },
        { // A
            question: "What is the intersection of all registered, appeared, and pass % total in CBSE?",
            options: ["81.4%", "0%", "93.5%", "267.3%"],
            answer: "81.4%"
        },
        { // B
            question: "What is the difference between union of pass % boys and girls in CISCE and pass % total in CISCE?",
            options: ["0%", "98.9%", "198.0%", "99.0%"],
            answer: "98.9%"
        },
        { // D
            question: "What is the complement of union of pass % boys and girls in CBSE (with respect to 200%)?",
            options: ["162.8%", "81.4%", "99.1%", "37.2%"],
            answer: "37.2%"
        },
        { // A
            question: "What is the union of appeared % in both boards and pass % total in CBSE?",
            options: ["174.9%", "81.4%", "92.4%", "99.1%"],
            answer: "174.9%"
        },
        { // C
            question: "What is the intersection of appeared % in both boards and pass % total in CBSE?",
            options: ["173.8%", "92.4%", "0%", "81.4%"],
            answer: "0%"
        },
        { // D
            question: "What is the difference between union of registered % and appeared % in both boards?",
            options: ["1.6%", "0%", "176.6%", "25.1%"],
            answer: "25.1%"
        },
        { // A
            question: "What is the complement of intersection of pass % boys in both boards (with respect to 100%)?",
            options: ["100%", "0%", "99.1%", "81.4%"],
            answer: "100%"
        },
        { // B
            question: "What is the union of pass % total in CBSE and pass % boys in CISCE?",
            options: ["81.4%", "180.0%", "98.6%", "99.1%"],
            answer: "180.0%"
        },
        { // C
            question: "What is the intersection of pass % total in CBSE and pass % boys in CISCE?",
            options: ["180.5%", "98.6%", "0%", "81.4%"],
            answer: "0%"
        },
        { // D
            question: "What is the difference between pass % girls in CISCE and appeared % in CISCE?",
            options: ["0%", "99.4%", "82.5%", "16.9%"],
            answer: "16.9%"
        },
        { // A
            question: "What is the complement of union of registered % and appeared % in CBSE (with respect to 200%)?",
            options: ["7.6%", "14.1%", "185.9%", "81.4%"],
            answer: "7.6%"
        },
        { // B
            question: "What is the union of pass % boys and pass % total in CISCE?",
            options: ["98.6%", "197.7%", "81.4%", "99.1%"],
            answer: "197.7%"
        },
        { // C
            question: "What is the intersection of pass % boys and pass % total in CISCE?",
            options: ["197.7%", "0%", "98.6%", "99.1%"],
            answer: "98.6%"
        },
        { // D
            question: "What is the difference between union of pass % boys and girls in CISCE and pass % total in CBSE?",
            options: ["198.0%", "81.4%", "99.1%", "117.5%"],
            answer: "117.5%"
        }
    ]
];




// --- QUIZ LOGIC ---
let allQuestions = [];
function showQuiz() {
    challengeTime = Math.max(30, 80 - 10 * puzzlesAnswered);
    startTimer();
    if (puzzlesAnswered >= NUM_QUESTIONS) {
        return;
    }
    let idx;
    do { idx = Math.floor(Math.random() * allQuestions.length); }
    while (usedQuestionIndices.has(idx));
    usedQuestionIndices.add(idx);
    const q = allQuestions[idx];
    questionEl.innerHTML = q.question;
    answersEl.innerHTML = '';
    quizFeedbackEl.textContent = '';
    nextBtn.style.display = 'none';
    quizEl.style.display = 'block';
    quizEl.style.background = "#222";
    quizEl.style.color = "#ffe066";
    questionEl.style.color = "#fff";
    quizTimerEl.style.color = "#ffea00";
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'quiz-option';
        btn.style.background = "#ffe066";
        btn.style.color = "#222";
        btn.style.borderColor = "#ffea00";
        btn.onclick = () => {
            Array.from(document.getElementsByClassName('quiz-option')).forEach(b => b.disabled = true);
            if (option === q.answer) {
                btn.classList.add('correct');
                quizFeedbackEl.textContent = 'Correct!';
                quizFeedbackEl.style.color = "#388e3c";
                quizFeedbackEl.style.fontSize = "1.5em";
                combo++;
                if (combo > maxCombo) maxCombo = combo;
                correctCount++;
                score += 100;
                puzzlesAnswered++;
            } else {
                btn.classList.add('incorrect');
                quizFeedbackEl.textContent = 'Wrong!';
                quizFeedbackEl.style.color = "#e53935";
                quizFeedbackEl.style.fontSize = "1.5em";
                wrongCount++;
                combo = 0;
                score -= 20;
                puzzlesAnswered++;
            }
            updateScore(0);
            nextBtn.style.display = 'inline-block';
        };
        answersEl.appendChild(btn);
    });
}


nextBtn.onclick = () => {
    quizEl.style.display = 'none';
    setTimeout(() => {
        if (puzzlesAnswered >= NUM_QUESTIONS) {
            spawnDoor();
            return;
        }
        challengeSpot = getRandomChallengeSpot();
        updateChallengeMesh();
        startTimer();
    }, 300);
};
// --- SCORE/COMBO ---
function updateScore(points) {
    scoreDisplay.textContent = "Score: " + score;
}




// --- GAME LOOP ---
function animate() {


    if (level === 1) {
        playerTurnSpeed = 0.045; // Fastest turning
    } else if (level === 2) {
        playerTurnSpeed = 0.03;  // Medium
    } else if (level === 3) {
        playerTurnSpeed = 0.018; // Slowest
    }


    if (pauseGameLoop) return;
    lastPlayerX = player.x;
    lastPlayerZ = player.z;


    let moveX = 0, moveZ = 0;
    if (keys['s']) {
        moveX += Math.sin(player.angle) * player.speed;
        moveZ += Math.cos(player.angle) * player.speed;
    }
    if (keys['w']) {
        moveX -= Math.sin(player.angle) * player.speed;
        moveZ -= Math.cos(player.angle) * player.speed;
    }
    if (keys['a']) {
        moveX += Math.sin(player.angle - Math.PI / 2) * player.speed * 0.7;
        moveZ += Math.cos(player.angle - Math.PI / 2) * player.speed * 0.7;
    }
    if (keys['d']) {
        moveX += Math.sin(player.angle + Math.PI / 2) * player.speed * 0.7;
        moveZ += Math.cos(player.angle + Math.PI / 2) * player.speed * 0.7;
    }
    if (keys['arrowleft'] || keys['q']) player.angle += playerTurnSpeed;
    if (keys['arrowright'] || keys['e']) { player.angle -= playerTurnSpeed };
    let nx = player.x + moveX;
    let nz = player.z + moveZ;
    let canMoveX = !sphereBoxCollision(nx, player.z);
    let canMoveZ = !sphereBoxCollision(player.x, nz);
    let canMoveBoth = !sphereBoxCollision(nx, nz);




    if (canMoveBoth) {
        player.x = nx;
        player.z = nz;
    } else if (canMoveX) {
        player.x = nx;
    } else if (canMoveZ) {
        player.z = nz;
    }
    let dx = player.x - lastPlayerX;
    let dz = player.z - lastPlayerZ;
    let dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.0001) {
        let moveAngle = Math.atan2(dx, dz);
        sphereRotX += Math.cos(moveAngle) * dist / 0.5;
        sphereRotZ += Math.sin(moveAngle) * dist / 0.5;
    }
    playerMesh.position.set(player.x, player.y, player.z);
    playerMesh.rotation.set(sphereRotX, 0, sphereRotZ);




    // Camera follows player, slightly behind and above, looking forward
    updateFirstPersonCamera();


    if (challengeMesh) {
        challengeMesh.material.emissiveIntensity = 0.7 + 0.3 * Math.sin(performance.now() / 400);
    }
    for (let mesh of powerupMeshes) {
        if (!mesh.visible) continue;
        mesh.rotation.y += 0.05;
        mesh.material.emissiveIntensity = 0.7 + 0.3 * Math.sin(performance.now() / 350 + mesh.position.x);
    }
    renderer.render(scene, camera);
    drawMinimap();
    checkChallengeProximity();
    checkPowerupProximity();
    checkDoorProximity();
    requestAnimationFrame(animate);
}


// --- REPORT CARD AND LEVEL PROGRESSION ---


function showCompletionScreen() {
    startScreen.style.display = 'none';
    if (levelDisplay) levelDisplay.style.display = "none";
    reportCard.style.display = 'none';

    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCorrect').textContent = correctCount;
    document.getElementById('finalWrong').textContent = wrongCount;
    document.getElementById('finalCombo').textContent = maxCombo;
    document.getElementById('finalPowerups').textContent = powerupsCollected;
    let totalTime = allLevelTimes.reduce((a, b) => a + b, 0);
    document.getElementById('finalTime').textContent = totalTime.toFixed(1);


    document.getElementById('completionScreen').style.display = 'flex';
}



function showReportCard() {
    clearInterval(timerInterval);
    rcScore.textContent = score;
    rcCorrect.textContent = correctCount;
    rcWrong.textContent = wrongCount;
    rcMaxCombo.textContent = maxCombo;
    rcTime.textContent = levelTimeTaken.toFixed(1);
    rcPowerups.textContent = powerupsCollected;
    reportCard.style.display = 'flex';
    restartBtn.textContent = "Next Level";
    nextLevelBtn.style.display = 'none';
}


restartBtn.onclick = () => {
    reportCard.style.display = 'none';
    nextLevelBtn.style.display = 'none';
    if (level < 3) {
        startLevel(level + 1);
    } else {
        showCompletionScreen();
    }
};
nextLevelBtn.onclick = restartBtn.onclick;


// Play Again button
document.getElementById('playAgainBtn').onclick = () => {
    document.getElementById('completionScreen').style.display = 'none';
    startScreen.style.display = '';
    if (levelDisplay) levelDisplay.style.display = "none";
};
// --- START LEVEL ---
function startLevel(lvl) {
    levelStartTime = Date.now();
    const levelDisplay = document.getElementById('levelDisplay');
    level = lvl;
    if (levelDisplay) {
        levelDisplay.textContent = "Level: " + level;
        levelDisplay.style.display = "block";
    }


    level = lvl;
    if (level === 1) {
        MAZE_SIZE = 17;
        NUM_QUESTIONS = 5;
    } else if (level === 2) {
        MAZE_SIZE = 27;
        NUM_QUESTIONS = 5;
    } else if (level === 3) {
        MAZE_SIZE = 37; // or any size you want for level 3
        NUM_QUESTIONS = 5;
    }
    challengeTime = 130;
    timer = 130;
    puzzlesAnswered = 0;
    correctCount = 0;
    wrongCount = 0;
    maxCombo = 0;
    combo = 0;
    score = 0;
    powerupsCollected = 0;
    usedQuestionIndices = new Set();
    allQuestions = levelQuestions[level - 1] || levelQuestions[0];
    generateMaze(MAZE_SIZE);
    buildMazeMeshes();
    const open = findOpenTiles();
    let startCell = open[Math.floor(Math.random() * open.length)];
    player.x = startCell.x * TILE_SIZE + TILE_SIZE / 2;
    player.z = startCell.y * TILE_SIZE + TILE_SIZE / 2;
    player.angle = 0;
    if (level === 1) {
        player.speed = player.baseSpeed = 0.14; // Fastest
    } else if (level === 2) {
        player.speed = player.baseSpeed = 0.085; // Medium
    } else if (level === 3) {
        player.speed = player.baseSpeed = 0.06; // Slowest
    }
    player.isGhost = false;
    challengeSpot = getRandomChallengeSpot();
    updateChallengeMesh();
    for (let mesh of powerupMeshes) scene.remove(mesh);
    powerupMeshes = [];
    spawnPowerups(1);
    doorMesh = null;
    doorCell = null;
    doorUnlocked = false;
    startScreen.style.display = 'none';
    reportCard.style.display = 'none';
    doorMsg.style.opacity = 0;
    if (jungleMusic.paused) jungleMusic.play();
    startTimer();
    animate();
    if (level === 1) showTutorialPopups();
}


// --- START GAME ---
startBtn.onclick = () => {
    if (jungleMusic.paused) jungleMusic.play();
    let minimap = document.getElementById('minimapCanvas')
    minimap.style.display = 'block';




    startLevel(1);
};


