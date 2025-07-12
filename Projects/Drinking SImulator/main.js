// Initialize audio
const audio = document.getElementById('themeMusic');
audio.volume = 0.3; // Set volume to 30%

// Handle autoplay restrictions
document.addEventListener('click', function() {
    if (audio.paused) {
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}, { once: true });

// Try to play immediately
audio.play().catch(e => {
    console.log('Autoplay prevented, audio will play on first click');
});

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 8);
camera.lookAt(0, 4, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('container').appendChild(renderer.domElement);

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffc107, 0.5, 20);
pointLight.position.set(-5, 8, -5);
scene.add(pointLight);

// Rim light for beer can
const rimLight = new THREE.PointLight(0xffffff, 0.3, 10);
rimLight.position.set(2, 5, 5);
scene.add(rimLight);

// Table
const tableGeometry = new THREE.BoxGeometry(20, 0.5, 15);
const tableTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
tableTexture.wrapS = THREE.RepeatWrapping;
tableTexture.wrapT = THREE.RepeatWrapping;
tableTexture.repeat.set(4, 4);

const tableMaterial = new THREE.MeshPhongMaterial({
    color: 0x8b4513,
    shininess: 30,
    map: tableTexture
});
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.position.y = 2;
table.receiveShadow = true;
scene.add(table);

// Function to create a beer can
function createBeerCan(x, z) {
    const beerGroup = new THREE.Group();
    beerGroup.userData.interactive = true;
    beerGroup.userData.isOpen = false;
    beerGroup.userData.beerAmount = 500;
    beerGroup.userData.velocity = new THREE.Vector3();
    beerGroup.userData.angularVelocity = new THREE.Vector3();

    // Can body
    const canGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4.5, 32);
    const canMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc0c0c0,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        reflectivity: 1,
        envMapIntensity: 1
    });
    const can = new THREE.Mesh(canGeometry, canMaterial);
    can.castShadow = true;
    can.receiveShadow = true;
    beerGroup.add(can);

    // Can top
    const topGeometry = new THREE.CylinderGeometry(0.75, 0.8, 0.3, 32);
    const topMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xa0a0a0,
        metalness: 0.9,
        roughness: 0.2
    });
    const canTop = new THREE.Mesh(topGeometry, topMaterial);
    canTop.position.y = 2.4;
    beerGroup.add(canTop);

    // Tab (for opening)
    const tabGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.8);
    const tabMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x909090,
        metalness: 0.9,
        roughness: 0.2
    });
    const tab = new THREE.Mesh(tabGeometry, tabMaterial);
    tab.position.set(0, 2.55, 0);
    tab.rotation.y = Math.PI / 6;
    tab.userData.originalRotation = tab.rotation.y;
    beerGroup.add(tab);

    // Beer liquid
    const beerGeometry = new THREE.CylinderGeometry(0.75, 0.75, 4, 32);
    const beerMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        transmission: 0.5,
        thickness: 0.5
    });
    const beer = new THREE.Mesh(beerGeometry, beerMaterial);
    beer.scale.y = 0.9;
    beer.position.y = -0.25;
    beer.userData.originalScale = beer.scale.y;
    beer.userData.originalY = beer.position.y;
    beerGroup.add(beer);

    // Foam
    const foamGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.3, 32);
    const foamMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });
    const foam = new THREE.Mesh(foamGeometry, foamMaterial);
    foam.position.y = 1.8;
    foam.visible = false;
    beerGroup.add(foam);

    // Outline effect for hover
    const outlineGeometry = new THREE.CylinderGeometry(0.85, 0.85, 4.6, 32);
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffc107,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.visible = false;
    beerGroup.add(outline);

    // Particle system for fizz
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = 2.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = Math.random() * 0.05 + 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    beerGroup.userData.particleVelocities = velocities;

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true,
        opacity: 0.6
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    particleSystem.visible = false;
    beerGroup.add(particleSystem);

    // Position beer can
    beerGroup.position.set(x, 4.5, z);

    return beerGroup;
}

// Create multiple beer cans
const beers = [];
const beerPositions = [
    { x: -3, z: -2 },
    { x: 0, z: -2 },
    { x: 3, z: -2 },
    { x: -1.5, z: 0 },
    { x: 1.5, z: 0 }
];

beerPositions.forEach(pos => {
    const beer = createBeerCan(pos.x, pos.z);
    beers.push(beer);
    scene.add(beer);
});

// Game state
let isNearBeer = false;
let isGrabbed = false;
let isOpen = false;
let beerAmount = 500;
let isDrinking = false;
let mouseY = 0;
let mouseDown = false;
let currentBeer = null;
let grabDistance = 5;
let thrownBeers = [];
let beerVelocity = new THREE.Vector3();
let lastMousePos = { x: 0, y: 0 };
let mouseVelocity = { x: 0, y: 0 };

// Touch state for mobile
let touchStartPos = { x: 0, y: 0 };
let lastTouchPos = { x: 0, y: 0 };
let touchVelocity = { x: 0, y: 0 };
let isTouchDevice = 'ontouchstart' in window;

// Hand position for smooth grab animation
let handOffset = new THREE.Vector3();
let grabStartPos = new THREE.Vector3();
let grabTargetPos = new THREE.Vector3();
let grabProgress = 0;

// Mouse position tracking
function updateMousePosition(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Check if mouse is near beer
function checkBeerProximity() {
    if (isGrabbed) return;

    raycaster.setFromCamera(mouse, camera);

    let closestBeer = null;
    let closestDistance = Infinity;

    beers.forEach(beer => {
        const intersects = raycaster.intersectObjects(beer.children, true);
        if (intersects.length > 0) {
            const distance = intersects[0].distance;
            if (distance < closestDistance && distance < 10) {
                closestDistance = distance;
                closestBeer = beer;
            }
        }
    });

    if (closestBeer) {
        if (!isNearBeer || currentBeer !== closestBeer) {
            // Reset previous beer outline
            if (currentBeer && currentBeer !== closestBeer) {
                const prevOutline = currentBeer.children.find(child => child.material && child.material.side === THREE.BackSide);
                if (prevOutline) prevOutline.visible = false;
            }

            isNearBeer = true;
            currentBeer = closestBeer;
            document.body.classList.add('near-beer');
            document.getElementById('grabIndicator').classList.remove('hidden');
            
            // Update grab text based on device
            const grabText = document.querySelector('.grab-text');
            if (grabText) {
                grabText.textContent = isTouchDevice ? 'Tap to grab' : 'Click to grab';
            }

            const outline = currentBeer.children.find(child => child.material && child.material.side === THREE.BackSide);
            if (outline) outline.visible = true;
        }
    } else {
        resetProximity();
    }
}

function resetProximity() {
    if (isNearBeer) {
        isNearBeer = false;
        if (currentBeer) {
            const outline = currentBeer.children.find(child => child.material && child.material.side === THREE.BackSide);
            if (outline) outline.visible = false;
        }
        currentBeer = null;
        document.body.classList.remove('near-beer');
        document.getElementById('grabIndicator').classList.add('hidden');
    }
}

// Mouse controls
renderer.domElement.addEventListener('mousemove', (e) => {
    updateMousePosition(e);

    // Track mouse velocity for throwing
    mouseVelocity.x = e.clientX - lastMousePos.x;
    mouseVelocity.y = e.clientY - lastMousePos.y;
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;

    if (mouseDown && currentBeer && currentBeer.userData.isOpen && currentBeer.userData.beerAmount > 0) {
        const deltaY = e.clientY - mouseY;
        if (deltaY > 5) { // Only tilt when dragging down significantly
            isDrinking = true;
            // Tilt towards camera (positive rotation.x)
            const tiltAmount = Math.min(deltaY * 0.005, Math.PI / 4);
            currentBeer.rotation.x = tiltAmount;

            // Also slight rotation on Z for natural pouring
            currentBeer.rotation.z = Math.sin(Date.now() * 0.01) * 0.05;
        }
    }

    if (isGrabbed && currentBeer && !mouseDown) {
        // Move beer can with mouse when grabbed
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const pos = camera.position.clone().add(dir.multiplyScalar(grabDistance));

        grabTargetPos.set(pos.x, Math.max(2.5, pos.y), pos.z);
    }
});

// Mouse wheel for depth control
renderer.domElement.addEventListener('wheel', (e) => {
    if (isGrabbed && currentBeer) {
        e.preventDefault();
        grabDistance += e.deltaY * 0.01;
        grabDistance = Math.max(2, Math.min(8, grabDistance));
    }
});

renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        if (isNearBeer && !isGrabbed && currentBeer) {
            grabBeer();
        } else if (isGrabbed && currentBeer && currentBeer.userData.isOpen) {
            mouseDown = true;
            mouseY = e.clientY;
            document.body.classList.add('grabbing');
        }
    } else if (e.button === 1) { // Middle click - throw beer
        e.preventDefault();
        if (isGrabbed && currentBeer) {
            throwBeer();
        }
    }
});

renderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isGrabbed && currentBeer && !currentBeer.userData.isOpen) {
        openBeer();
    }
});

renderer.domElement.addEventListener('mouseup', () => {
    mouseDown = false;
    isDrinking = false;
    document.body.classList.remove('grabbing');
});

// Add keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && isGrabbed && currentBeer) { // Space to throw
        e.preventDefault();
        throwBeer();
    }
});

// Touch controls for mobile
renderer.domElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartPos.x = touch.clientX;
    touchStartPos.y = touch.clientY;
    lastTouchPos.x = touch.clientX;
    lastTouchPos.y = touch.clientY;
    
    // Convert touch to mouse coordinates
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    checkBeerProximity();
    
    if (isNearBeer && !isGrabbed && currentBeer) {
        grabBeer();
    } else if (isGrabbed && currentBeer && currentBeer.userData.isOpen) {
        mouseDown = true;
        mouseY = touch.clientY;
        document.body.classList.add('grabbing');
    }
});

renderer.domElement.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    // Update mouse position for raycasting
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    // Track touch velocity
    touchVelocity.x = touch.clientX - lastTouchPos.x;
    touchVelocity.y = touch.clientY - lastTouchPos.y;
    lastTouchPos.x = touch.clientX;
    lastTouchPos.y = touch.clientY;
    
    if (mouseDown && currentBeer && currentBeer.userData.isOpen && currentBeer.userData.beerAmount > 0) {
        const deltaY = touch.clientY - mouseY;
        if (deltaY > 5) {
            isDrinking = true;
            const tiltAmount = Math.min(deltaY * 0.005, Math.PI / 4);
            currentBeer.rotation.x = tiltAmount;
            currentBeer.rotation.z = Math.sin(Date.now() * 0.01) * 0.05;
        }
    }
    
    if (isGrabbed && currentBeer && !mouseDown) {
        // Move beer with touch
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const pos = camera.position.clone().add(dir.multiplyScalar(grabDistance));
        grabTargetPos.set(pos.x, Math.max(2.5, pos.y), pos.z);
    }
});

renderer.domElement.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    if (mouseDown) {
        mouseDown = false;
        isDrinking = false;
        document.body.classList.remove('grabbing');
    }
    
    // Double tap to open beer
    const now = Date.now();
    const timeSinceLastTap = now - (renderer.domElement.lastTapTime || 0);
    renderer.domElement.lastTapTime = now;
    
    if (timeSinceLastTap < 300 && isGrabbed && currentBeer && !currentBeer.userData.isOpen) {
        openBeer();
    }
    
    // Swipe up to throw
    const swipeDistance = touchStartPos.y - lastTouchPos.y;
    if (swipeDistance > 50 && isGrabbed && currentBeer) {
        // Use touch velocity for throwing
        mouseVelocity.x = touchVelocity.x;
        mouseVelocity.y = touchVelocity.y;
        throwBeer();
    }
});

// Pinch gesture for grab distance (mobile zoom)
let lastPinchDistance = 0;
renderer.domElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isGrabbed && currentBeer) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (lastPinchDistance > 0) {
            const delta = distance - lastPinchDistance;
            grabDistance += delta * 0.01;
            grabDistance = Math.max(2, Math.min(8, grabDistance));
        }
        
        lastPinchDistance = distance;
    }
});

renderer.domElement.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        lastPinchDistance = 0;
    }
});

function grabBeer() {
    if (!currentBeer) return;

    isGrabbed = true;
    isOpen = currentBeer.userData.isOpen;
    beerAmount = currentBeer.userData.beerAmount;
    grabProgress = 0;
    grabStartPos.copy(currentBeer.position);
    grabTargetPos.copy(currentBeer.position);
    grabDistance = 5;

    document.getElementById('instructions').style.opacity = '0';
    document.getElementById('grabIndicator').classList.add('hidden');
    document.getElementById('crosshair').classList.remove('hidden');
    document.body.classList.remove('near-beer');
    document.body.classList.add('holding');

    // Update beer meter
    document.getElementById('beerAmount').textContent = Math.round(beerAmount);
    document.getElementById('beerAmount').classList.remove('empty');

    const outline = currentBeer.children.find(child => child.material && child.material.side === THREE.BackSide);
    if (outline) outline.visible = false;

    // Add grab effect
    const scaleAnimation = { scale: 1 };
    const scaleTween = new TWEEN.Tween(scaleAnimation)
        .to({ scale: 1.05 }, 200)
        .easing(TWEEN.Easing.Elastic.Out)
        .onUpdate(() => {
            currentBeer.scale.setScalar(scaleAnimation.scale);
        })
        .onComplete(() => {
            new TWEEN.Tween(scaleAnimation)
                .to({ scale: 1 }, 100)
                .onUpdate(() => {
                    currentBeer.scale.setScalar(scaleAnimation.scale);
                })
                .start();
        })
        .start();
}

function openBeer() {
    if (!currentBeer || currentBeer.userData.isOpen) return;

    currentBeer.userData.isOpen = true;
    isOpen = true;

    const tab = currentBeer.children.find(child => child.userData.originalRotation !== undefined);
    const foam = currentBeer.children.find(child => child.material && child.material.opacity === 0.7);
    const particleSystem = currentBeer.children.find(child => child.isPoints);

    if (!tab) return;

    // Animate tab with sound effect
    const startRotation = tab.rotation.y;
    const endRotation = startRotation + Math.PI / 2;
    const duration = 300;

    // Can opening effect
    const openAnimation = { progress: 0 };
    const openTween = new TWEEN.Tween(openAnimation)
        .to({ progress: 1 }, duration)
        .easing(TWEEN.Easing.Back.Out)
        .onUpdate(() => {
            tab.rotation.y = startRotation + (endRotation - startRotation) * openAnimation.progress;

            // Slight can shake
            const shake = Math.sin(openAnimation.progress * Math.PI * 4) * 0.02 * (1 - openAnimation.progress);
            currentBeer.position.x = grabTargetPos.x + shake;
        })
        .onComplete(() => {
            if (foam) foam.visible = true;
            if (particleSystem) particleSystem.visible = true;

            // Foam animation
            if (foam) {
                const foamAnimation = { scale: 0, opacity: 0 };
                new TWEEN.Tween(foamAnimation)
                    .to({ scale: 1, opacity: 0.7 }, 500)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .onUpdate(() => {
                        foam.scale.y = foamAnimation.scale;
                        foam.material.opacity = foamAnimation.opacity;
                    })
                    .start();
            }
        })
        .start();
}

function throwBeer() {
    if (!currentBeer) return;

    // Calculate throw velocity based on mouse movement
    const throwForce = 0.05;
    currentBeer.userData.velocity.set(
        mouseVelocity.x * throwForce,
        Math.max(0.1, -mouseVelocity.y * throwForce),
        -Math.random() * 0.2 - 0.1
    );

    // Add some rotation
    currentBeer.userData.angularVelocity.set(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    );

    // Move to thrown beers array
    thrownBeers.push(currentBeer);
    const index = beers.indexOf(currentBeer);
    if (index > -1) beers.splice(index, 1);

    // Reset state
    isGrabbed = false;
    isOpen = false;
    currentBeer = null;
    beerAmount = 500;
    isDrinking = false;

    document.getElementById('crosshair').classList.add('hidden');
    document.body.classList.remove('holding', 'grabbing');
    document.getElementById('beerAmount').textContent = '500';

    // Show instructions if no beers left
    if (beers.length === 0) {
        document.getElementById('instructions').textContent = 'All beers thrown! Refresh to play again.';
        document.getElementById('instructions').style.opacity = '1';
    }
}

// TWEEN.js setup
const TWEEN = {
    Tween: function(object) {
        this.object = object;
        this.valuesStart = {};
        this.valuesEnd = {};
        this.duration = 1000;
        this.delayTime = 0;
        this.startTime = null;
        this.easingFunction = TWEEN.Easing.Linear.None;
        this.onUpdateCallback = null;
        this.onCompleteCallback = null;
        this.chainedTweens = [];

        this.to = function(properties, duration) {
            this.valuesEnd = properties;
            if (duration !== undefined) {
                this.duration = duration;
            }
            return this;
        };

        this.start = function(time) {
            TWEEN.add(this);
            this.startTime = time !== undefined ? time : Date.now();
            this.startTime += this.delayTime;

            for (const property in this.valuesEnd) {
                this.valuesStart[property] = this.object[property];
            }
            return this;
        };

        this.update = function(time) {
            if (time < this.startTime) {
                return true;
            }

            const elapsed = (time - this.startTime) / this.duration;
            const value = this.easingFunction(Math.min(elapsed, 1));

            for (const property in this.valuesEnd) {
                const start = this.valuesStart[property];
                const end = this.valuesEnd[property];
                this.object[property] = start + (end - start) * value;
            }

            if (this.onUpdateCallback !== null) {
                this.onUpdateCallback(this.object);
            }

            if (elapsed >= 1) {
                if (this.onCompleteCallback !== null) {
                    this.onCompleteCallback(this.object);
                }
                return false;
            }

            return true;
        };

        this.easing = function(easingFunction) {
            this.easingFunction = easingFunction;
            return this;
        };

        this.onUpdate = function(callback) {
            this.onUpdateCallback = callback;
            return this;
        };

        this.onComplete = function(callback) {
            this.onCompleteCallback = callback;
            return this;
        };
    },

    Easing: {
        Linear: {
            None: function(k) { return k; }
        },
        Elastic: {
            Out: function(k) {
                if (k === 0) return 0;
                if (k === 1) return 1;
                return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
            }
        },
        Back: {
            Out: function(k) {
                const s = 1.70158;
                return --k * k * ((s + 1) * k + s) + 1;
            }
        }
    },

    tweens: [],

    add: function(tween) {
        this.tweens.push(tween);
    },

    update: function(time) {
        if (this.tweens.length === 0) return false;

        let i = 0;
        while (i < this.tweens.length) {
            if (this.tweens[i].update(time)) {
                i++;
            } else {
                this.tweens.splice(i, 1);
            }
        }
        return true;
    }
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update tweens
    TWEEN.update(Date.now());

    // Check beer proximity
    if (!isGrabbed) {
        checkBeerProximity();
    }

    // Smooth grab position interpolation
    if (isGrabbed && currentBeer && !mouseDown) {
        grabProgress = Math.min(grabProgress + 0.1, 1);
        currentBeer.position.lerpVectors(grabStartPos, grabTargetPos, grabProgress);
        grabStartPos.copy(currentBeer.position);
    }

    // Update beer level when drinking
    if (isDrinking && currentBeer && currentBeer.userData.beerAmount > 0) {
        currentBeer.userData.beerAmount -= 2;
        currentBeer.userData.beerAmount = Math.max(0, currentBeer.userData.beerAmount);
        beerAmount = currentBeer.userData.beerAmount;
        document.getElementById('beerAmount').textContent = Math.round(beerAmount);

        // Add empty class when beer runs out
        if (beerAmount === 0) {
            document.getElementById('beerAmount').classList.add('empty');
        }

        // Update beer liquid level
        const beer = currentBeer.children.find(child => child.userData.originalScale !== undefined);
        const foam = currentBeer.children.find(child => child.material && child.material.opacity === 0.7);

        if (beer) {
            const scale = beerAmount / 500;
            beer.scale.y = scale * beer.userData.originalScale;
            beer.position.y = beer.userData.originalY - (1 - scale) * 2;

            // Update foam position
            if (foam) {
                foam.position.y = beer.position.y + beer.scale.y * 2 + 0.15;

                // Hide foam when beer is low
                if (beerAmount < 50) {
                    foam.visible = false;
                }
            }
        }

        // Add pouring effect - liquid particles
        if (Math.random() < 0.3) {
            const droplet = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshPhysicalMaterial({ color: 0xffa500, transparent: true, opacity: 0.8 })
            );
            droplet.position.copy(currentBeer.position);
            droplet.position.y += 2;
            droplet.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                -0.3,
                (Math.random() - 0.5) * 0.1
            );
            droplet.userData.life = 60;
            thrownBeers.push(droplet);
            scene.add(droplet);
        }
    }

    // Return can to upright position
    if (!mouseDown && currentBeer && (currentBeer.rotation.x !== 0 || currentBeer.rotation.z !== 0)) {
        currentBeer.rotation.x *= 0.9;
        currentBeer.rotation.z *= 0.9;
        if (Math.abs(currentBeer.rotation.x) < 0.01) currentBeer.rotation.x = 0;
        if (Math.abs(currentBeer.rotation.z) < 0.01) currentBeer.rotation.z = 0;
    }

    // Physics for thrown beers
    for (let i = thrownBeers.length - 1; i >= 0; i--) {
        const beer = thrownBeers[i];

        // Apply velocity
        if (beer.userData.velocity) {
            beer.position.add(beer.userData.velocity);

            // Apply gravity
            beer.userData.velocity.y -= 0.01;

            // Apply angular velocity
            if (beer.userData.angularVelocity) {
                beer.rotation.x += beer.userData.angularVelocity.x;
                beer.rotation.y += beer.userData.angularVelocity.y;
                beer.rotation.z += beer.userData.angularVelocity.z;
            }

            // Floor collision
            if (beer.position.y < 0) {
                beer.position.y = 0;
                beer.userData.velocity.y *= -0.3; // Bounce
                beer.userData.velocity.x *= 0.8; // Friction
                beer.userData.velocity.z *= 0.8;

                if (beer.userData.angularVelocity) {
                    beer.userData.angularVelocity.x *= 0.8;
                    beer.userData.angularVelocity.y *= 0.8;
                    beer.userData.angularVelocity.z *= 0.8;
                }
            }

            // Remove if fallen off the world or is a droplet that expired
            if (beer.position.y < -10 || (beer.userData.life !== undefined && --beer.userData.life <= 0)) {
                scene.remove(beer);
                thrownBeers.splice(i, 1);
            }
        }
    }

    // Animate all beers
    [...beers, ...thrownBeers].forEach(beer => {
        // Subtle floating animation when grabbed
        if (beer === currentBeer && isGrabbed) {
            const floatY = Math.sin(Date.now() * 0.002) * 0.03;
            const floatX = Math.sin(Date.now() * 0.003) * 0.02;
            beer.position.y = grabTargetPos.y + floatY;
            beer.position.x = grabTargetPos.x + floatX;

            if (!beer.userData.isOpen) {
                beer.rotation.y += 0.002;
            }
        }

        // Hover effect animation
        const outline = beer.children.find(child => child.material && child.material.side === THREE.BackSide);
        if (outline && outline.visible) {
            outline.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.1;
        }

        // Update particles
        const particleSystem = beer.children.find(child => child.isPoints);
        if (particleSystem && particleSystem.visible) {
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = beer.userData.particleVelocities;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += velocities[i * 3 + 1];

                // Reset particle when it goes too high
                if (positions[i * 3 + 1] > 3.5) {
                    positions[i * 3] = (Math.random() - 0.5) * 0.5;
                    positions[i * 3 + 1] = 2.5;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
                }
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    });

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();