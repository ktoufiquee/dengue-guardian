import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import { MTLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

let scene, renderer, camera, canvas, character, mixer;
let mosquito_arr = [];
let count = 0, max_limit = 10, score = 0;
let m_pos_check = false, m_pos_event;
let health = document.getElementById("health");
let soundStarted = false;
let audioListener, background_music, game_over_sound, mosquito_splat;
let tree;

let targetObject = new THREE.Object3D();
targetObject.position.x = -30;
targetObject.position.y = 0;



const radius = 50;
let angle = 1.5;

let leftKeyPressed = false;
let rightKeyPressed = false;

const fbx_loader = new FBXLoader();
const obj_loader = new OBJLoader();
const mtl_loader = new MTLLoader();
const gltf_loader = new GLTFLoader();

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

init_base();
init_environment();
init_models();
animate();
update_score_display();
init_audio(); 
//load_audio();

function handleKeyDown(event) {
	if (event.key === 'ArrowLeft') {
		leftKeyPressed = true;
	} else if (event.key === 'ArrowRight') {
		rightKeyPressed = true;
	}
}

function handleKeyUp(event) {
	if (event.key === 'ArrowLeft') {
		leftKeyPressed = false;
	} else if (event.key === 'ArrowRight') {
		rightKeyPressed = false;
	}
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	if (character) {
		mosquito_arr.map((value, index) => {
			let to_del = value.mouse_check();
			if (to_del) {
				value.delete(scene);
				mosquito_splat.play();
				mosquito_arr.splice(index, 1);
			} else {
				value.update_position(character.position);
			}
		});
		m_pos_check = false;
	}

	if (count <= 0) {
		for (let i = count; i < max_limit; i = i + 1) {
			spawn_mosquito();
			count = count + 1;
		}
		max_limit = max_limit + 1;
	}

	if (mixer) {
		mixer.update(0.016);
	}

	let distanceFromCharacter = 10;
	let rotationSpeed = 0.05;

	const centerPoint = new THREE.Vector3(0, 20, 0); 

	if (leftKeyPressed) {
		angle += rotationSpeed;
	} else if (rightKeyPressed) {
		angle -= rotationSpeed;
	}

	const x = centerPoint.x + Math.cos(angle) * radius;
	const z = centerPoint.z + Math.sin(angle) * radius;

	camera.position.set(x, centerPoint.y, z);
	camera.lookAt(centerPoint);

}

function init_base() {
	canvas = document.getElementById('canvas');
	canvas.addEventListener('mousedown', (event) => {
		m_pos_check = true;
		m_pos_event = event;
	});

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
	camera.position.y = 20;
	camera.position.z = 50;

	renderer = new THREE.WebGLRenderer({ canvas: canvas });
	renderer.setSize(800, 450);
	// renderer.setClearColor(0xffffff);
	renderer.shadowMap.enabled = true; // Enable shadow mapping
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Set shadow map type

	const ambientLight = new THREE.AmbientLight(0xa9a9a9);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
	directionalLight.position.set(10, 0, 5); // You can adjust the position of the light
	directionalLight.castShadow = true; // Enable shadow casting

	scene.add(targetObject);
	directionalLight.target = targetObject;

	scene.add(directionalLight);

	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 2000;
	directionalLight.shadow.camera.left = -10;
	directionalLight.shadow.camera.right = 10;
	directionalLight.shadow.camera.top = 40;
	directionalLight.shadow.camera.bottom = -20;
	directionalLight.shadow.focus = 1;

	// const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
	// scene.add(helper);

}

function init_environment() {
	const floorTexture = new THREE.TextureLoader().load('./images/tiles7.jpg');
	floorTexture.magFilter = THREE.NearestFilter;
	floorTexture.minFilter = THREE.NearestFilter;
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(2, 2); // Number of tiles along each axis

	const floorGeometry = new THREE.PlaneGeometry(300, 150); // Size of the floor
	const floorMaterial = new THREE.MeshStandardMaterial({
		map: floorTexture
	});

	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.rotation.x = -Math.PI / 2; 
	floor.receiveShadow = true;
	scene.add(floor);

	// Create walls
	const wallTexture = new THREE.TextureLoader().load('./images/tiles6.jpg');
	wallTexture.magFilter = THREE.NearestFilter;
	wallTexture.minFilter = THREE.NearestFilter;
	wallTexture.wrapS = THREE.RepeatWrapping;
	wallTexture.wrapT = THREE.RepeatWrapping;
	wallTexture.repeat.set(5, 5); // Number of tiles along each axis

	const wallGeometry = new THREE.PlaneGeometry(350, 200); // Size of the walls
	const wallMaterial = new THREE.MeshStandardMaterial({
		map: wallTexture
	});

	

	// Front wall
	const wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
	wallFront.position.set(0, 25, -50);
	wallFront.rotation.y = 0;
	wallFront.receiveShadow = true;
	scene.add(wallFront);

	// Back wall
	const wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
	wallBack.position.set(0, 25, 50);
	wallBack.rotation.y = Math.PI;
	wallBack.receiveShadow = true;
	scene.add(wallBack);

	// Left wall
	const wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
	wallLeft.position.set(100, 25, 0);
	wallLeft.rotation.y = -Math.PI / 2;
	wallLeft.receiveShadow = true;
	scene.add(wallLeft);

	// Right wall
	const wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
	wallRight.position.set(-100, 25, 0);
	wallRight.rotation.y = Math.PI / 2;
	wallRight.receiveShadow = true;
	scene.add(wallRight);

	// Ceiling
	const wallCeiling = new THREE.Mesh(floorGeometry, wallMaterial);
	wallCeiling.position.set(0, 75, 0); 
	wallCeiling.rotation.x = -Math.PI / 2; // Rotate 90 degrees around X-axis
	wallCeiling.scale.z *= -1;
	wallCeiling.receiveShadow = true;
	scene.add(wallCeiling);

}

function init_models() {
	fbx_loader.load('Sitting.fbx', (fbx) => {
		character = fbx;
		character.castShadow = true;
		character.receiveShadow = false;
		character.traverse(function (child) {
			if (child.isMesh) {
				child.castShadow = true;
				console.log('1')
			}
		});

		scene.add(character);

		character.scale.set(0.1, 0.1, 0.1);

		character.position.x = - 30;
		character.rotation.y = Math.PI / 5;

		mixer = new THREE.AnimationMixer(character);
		const action = mixer.clipAction(fbx.animations[1]);
		action.setLoop(THREE.LoopRepeat);
		action.play();
		animate();
	});

	// mtl_loader.load('Low-Poly Plant_.mtl', (materials) => {
	// 	materials.preload();
	// 	obj_loader.setMaterials(materials);
	// });

	// obj_loader.load('Low-Poly Plant_.obj', (obj) => {
	// 	let tree = obj;
	// 	tree.scale.set(0.8, 0.8, 0.8);
	// 	tree.rotation.x = -Math.PI / 2;
	// 	tree.position.x = 55;
	// 	tree.position.z = -2;
	// 	tree.rotation.z = Math.PI / 5;
	// 	object.traverse(function (child) {
	// 		if (child instanceof THREE.Mesh) {
	// 			// child is one of the models in the OBJ file
	// 			// you can add it to the scene or manipulate it as needed
	// 			scene.add(child);
	// 		}
	// 	});


	// 	scene.add(tree);
	// })

	mtl_loader.load('Chair.mtl', (materials) => {
		materials.preload();
		obj_loader.setMaterials(materials);
	});

	obj_loader.load('Chair.obj', (obj) => {
		let chair = obj;
		chair.castShadow = true;
		chair.receiveShadow = false;
		chair.traverse(function (child) {
			if (child.isMesh) {
				child.castShadow = true;
				console.log('2')
			}
		});

		scene.add(chair);
		chair.scale.set(0.02, 0.02, 0.02);
		chair.rotation.x = -Math.PI / 2;
		chair.position.x = -31;
		chair.position.z = -2;
		chair.rotation.z = Math.PI / 5;
	});
}

function spawn_mosquito() {
	obj_loader.load('Mosquito.obj', (obj) => {
		let curr_mosquito = obj;
		// curr_mosquito.castShadow = true;
		// curr_mosquito.receiveShadow = false;
		// const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
		obj.traverse(function (x) {
			if (x.isMesh) {
				x.material.color.set(0x000000);
			}
		});


		scene.add(curr_mosquito);
		curr_mosquito.scale.set(0.008, 0.008, 0.008);
		curr_mosquito.scale.x = -1 * curr_mosquito.scale.x;
		curr_mosquito.position.x = 60;
		curr_mosquito.position.y = Math.random() * 100;
		mosquito_arr.push(new mosquito(curr_mosquito));
	});
}

class mosquito {

	constructor(model) {
		this.model = model;
		this.mosquitoSpeed = 0.1;
		this.mosquitoDirection = new THREE.Vector3();
		this.mosquitoRandomness = Math.random();
		this.mosquitoRandomVelocity = new THREE.Vector3();
	}

	update_position(character_pos) {

		let updated_pos = new THREE.Vector3(character_pos.x + 7, character_pos.y + (Math.random() * 20), character_pos.z);
		this.mosquitoDirection.subVectors(updated_pos, this.model.position).normalize();

		this.mosquitoRandomVelocity.set(
			(Math.random() - 0.5) * this.mosquitoRandomness,
			(Math.random() - 0.5) * this.mosquitoRandomness,
			0
		);

		const time = Date.now() * 0.001;
		const amplitude = Math.random();
		const frequency = 5;
		const yMovement = Math.cos(time * frequency) * amplitude;

		this.mosquitoDirection.add(this.mosquitoRandomVelocity).normalize();
		this.model.position.addScaledVector(this.mosquitoDirection, this.mosquitoSpeed + Math.random() * this.mosquitoRandomness);
		this.model.position.y += yMovement;
		if (this.model.position.y <= 1) {
			this.model.position.y = 1;
		}
		if (this.model.position.x < -22) {
			health.value -= 0.01;
			check_health();
		}

	}

	get_distance(x1, y1, x2, y2) {
		return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
	}

	mouse_check() {
		if (m_pos_check == true) {
			const target = m_pos_event.target;
			const rect = target.getBoundingClientRect();
			const x1 = ((m_pos_event.clientX - rect.left) / target.width) * 2 - 1;
			const y1 = -((m_pos_event.clientY - rect.top) / target.height) * 2 + 1;

			let mouse_vec = this.unprojected_distance(x1, y1, 0.1);
			let model_vec = this.unprojected_distance(this.model.position.x, this.model.position.y, 0.1);
			let dist = this.get_distance(mouse_vec.x, mouse_vec.y, model_vec.x, model_vec.y);
			if (dist < 10) {
				return true;
			}
			return false;
		}
	}

	unprojected_distance(x, y, z) {
		let temp = new THREE.Vector3();
		temp.set(x, y, z);
		temp.unproject(camera);
		return temp;
	}

	delete(curr_scene) {
		curr_scene.remove(this.model);
		score = score + 1;
		count = count - 1;
		update_score_display();
	}

}
function update_score_display() {
	const score_display_element = document.getElementById("scoreDisplay");
	score_display_element.textContent = `Score: ${score}`;
}



function init_audio() {
	audioListener = new THREE.AudioListener();
	background_music = new THREE.Audio(audioListener);
	game_over_sound = new THREE.Audio(audioListener);
	mosquito_splat = new THREE.Audio(audioListener);

	const audio_loader = new THREE.AudioLoader();
	


	const audio_file = 'music/music1.mp3';
	audio_loader.load(audio_file, function (buffer) {
	  background_music.setBuffer(buffer);
	  background_music.play();
	  background_music.setLoop(true);
	  background_music.setVolume(0.4);
	});
  
	const game_over_sound_file = 'music/game_over.mp3';
	audio_loader.load(game_over_sound_file, function (buffer) {
	  game_over_sound.setBuffer(buffer);
	  game_over_sound.setLoop(false);
	  game_over_sound.setVolume(1.0);
	});

	const mosquito_splat_file = 'music/mosquito_killing.mp3';
	audio_loader.load(mosquito_splat_file, function (buffer) {
	  mosquito_splat.setBuffer(buffer);
	  mosquito_splat.setLoop(false);
	  mosquito_splat.setVolume(0.4);
	});
  }
  
//   canvas.addEventListener("click", () => {
// 	if (!soundStarted) {
// 	  background_music.play();
// 	  soundStarted = true;
// 	}
//   });


let isGameOver = false;   

function check_health() {
	if (health.value <= 0 && !isGameOver) {
		health.value = 0;
		isGameOver = true;
		game_over_sound.play();
		if (background_music.isPlaying) {
            background_music.stop();
        }
		background_music.stop();
		const splashScreen = document.getElementById("splashScreen");
		const finalScoreElement = document.getElementById("finalScore");
		finalScoreElement.textContent = score;
		splashScreen.style.display = "block";
		document.getElementById("hud").style.display = "none";
		canvas.style.display = "none";
	}
}


// function check_health() {
// 	if (health.value <= 0) {
// 	console.log('game over!')
// 	  game_over_sound.play();
// 	  game_over_sound.setLoop(false);
// 	}
//   }
