// ============= OTHER PLAYERS =============
// Multiplayer player representations

import { state } from '../state.js';

const THREE = window.THREE;

export function createOtherPlayerMesh(playerData) {
    const group = new THREE.Group();

    // Use a simpler version for other players (performance)
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x4CAF50 }); // Green for other players
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // Simple bike body
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), blackMat);
    frame.position.y = 0.6;
    group.add(frame);

    // Rider body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), bodyMat);
    body.position.set(0, 1.5, -0.3);
    group.add(body);

    // Rider head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bodyMat);
    head.position.set(0, 2, -0.2);
    group.add(head);

    // Wheels
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8), wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, 1);
    group.add(frontWheel);

    const rearWheel = frontWheel.clone();
    rearWheel.position.z = -0.8;
    group.add(rearWheel);

    // Delivery bag (green with accents)
    const bagGroup = new THREE.Group();
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const darkGreenMat = new THREE.MeshBasicMaterial({ color: 0x388E3C });

    // Main bag
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), bodyMat);
    bag.position.y = 0.35;
    bagGroup.add(bag);

    // Lid with yellow stripe
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.52), bodyMat);
    lid.position.y = 0.75;
    bagGroup.add(lid);

    const lidStripe = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.03, 0.54), yellowMat);
    lidStripe.position.y = 0.80;
    bagGroup.add(lidStripe);

    // Simple logo (white background with fork/knife)
    const logoBg = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), whiteMat);
    logoBg.position.set(0, 0.38, 0.251);
    bagGroup.add(logoBg);

    // Simple fork & knife icon
    const forkKnife = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), darkGreenMat);
    forkKnife.position.set(0, 0.38, 0.252);
    bagGroup.add(forkKnife);

    // Yellow bottom stripe
    const bottomStripe = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.48), yellowMat);
    bottomStripe.position.y = 0.03;
    bagGroup.add(bottomStripe);

    bagGroup.position.set(0, 1.5, -0.7);
    group.add(bagGroup);

    // Username label (canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerData.username || 'Player', 128, 32);

    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), labelMaterial);
    label.position.set(0, 3.5, 0);
    group.add(label);
    group.userData.label = label;

    // Set initial position
    if (playerData.position) {
        group.position.set(playerData.position.x, 0, playerData.position.z);
        group.rotation.y = playerData.position.rotation || 0;
    }

    return group;
}

export function updateOtherPlayerPosition(playerId, position) {
    const player = state.otherPlayers[playerId];
    if (!player || !player.mesh) return;

    // Lerp to new position for smooth movement
    player.targetPosition = {
        x: position.x,
        z: position.z,
        rotation: position.rotation || 0
    };
}

export function updateOtherPlayers() {
    if (!state.isMultiplayer) return;

    Object.values(state.otherPlayers).forEach(player => {
        if (!player.mesh || !player.targetPosition) return;

        // Smooth interpolation
        player.mesh.position.x += (player.targetPosition.x - player.mesh.position.x) * 0.15;
        player.mesh.position.z += (player.targetPosition.z - player.mesh.position.z) * 0.15;

        // Smooth rotation
        let rotDiff = player.targetPosition.rotation - player.mesh.rotation.y;
        // Handle wrap-around
        if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        player.mesh.rotation.y += rotDiff * 0.15;

        // Make label face camera
        if (player.mesh.userData.label) {
            player.mesh.userData.label.lookAt(state.camera.position);
        }
    });
}

export function addOtherPlayer(playerData) {
    if (state.otherPlayers[playerData.id]) return;

    console.log('addOtherPlayer - received data:', playerData);

    const mesh = createOtherPlayerMesh(playerData);
    state.scene.add(mesh);

    state.otherPlayers[playerData.id] = {
        data: playerData,
        mesh: mesh,
        targetPosition: playerData.position || { x: 0, z: 0, rotation: 0 }
    };

    console.log('Added player:', playerData.username, 'with money:', playerData.money);
}

export function removeOtherPlayer(playerId) {
    if (!state.otherPlayers[playerId]) return;

    if (state.otherPlayers[playerId].mesh) {
        state.scene.remove(state.otherPlayers[playerId].mesh);
    }
    delete state.otherPlayers[playerId];

    console.log('Removed player:', playerId);
}
