import * as THREE from 'https://threejs.org/build/three.module.js';
import '../css/main.css'
//import * as THREE from 'three'


const _gridVS = `
varying vec2 Uv;
void main(){
    Uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _gridFS = `
uniform float Time;
varying vec2 Uv;

float rand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);

	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float GridValue(vec2 _uv, float _sx, float _sy)
{
    float vx = floor(mod(_uv.x * _sx, 2.0));
    float vy = floor(mod(_uv.y * _sy, 2.0));
    return vx * (1.0-vy) + vy * (1.0-vx);
}

void main(){
    // Grid
    float c1 = 0.1;
    float c2 = 0.11;
    float c3 = 0.008;

    vec4 col1 = vec4(c1, c1, c1, 1.0);
    vec4 col2 = vec4(c2, c2, c2, 1.0);

    float vxy = GridValue(Uv, 200.0, 80.0);
    float vxy2 = GridValue(Uv, 20.0, 8.0);

    vec4 gridColor = mix(col1, col2, vxy);
    gridColor = mix(gridColor, gridColor+c3, vxy2);

    // Animated LightRay
    float lightray = max((sin((sin(Uv.x + 2.0) + Uv.y + Time - 1.0) * 4.0 )) / 1.2, 0.0);
    lightray = pow(lightray, 8.0);
    lightray *= (vxy + vxy2) / 2.0; // lightray vissible only at light grid
    gridColor = mix(gridColor, gridColor + 0.07, lightray);

    // Top light
    gridColor += pow(Uv.y, 4.0) / 6.0;

    // Bottom Shadow
    gridColor -= pow(1.0 - Uv.y, 4.0) / 16.0;

    /*
    //Bottom Smoke
    float size = 8.0;
    vec2 nUv = Uv;
    nUv.y /= 1.8;
    nUv.y -= Time/20.0;
    float noise0 = noise(nUv*50.0);
    float noise1 = noise(nUv*100.0);
    nUv.x += 3.5;
    nUv.y -= Time/20.0;
    float noise2 = noise(nUv*200.0);
    nUv.y -= Time/40.0;
    nUv.x += 2.5;
    float noise3 = noise(nUv*300.0);
    float bottomSmoke = (noise0 + noise1 + noise2 + noise3)/ 4.0;
    bottomSmoke *=  (1.0 - Uv.y * size);
    bottomSmoke = min(1.0, 1.0 - bottomSmoke);
    bottomSmoke *= min(1.0, 1.0 - (1.0 - Uv.y * 15.0)*0.3);//AdditionalSmoke
    gridColor *= bottomSmoke;
    */

    /*
    // Circle shadow
    float dis = distance(Uv, vec2(0.5, 0.5));
    dis = min(1.0 - dis, 1.0);
    gridColor *= dis;
    */

    gl_FragColor =  gridColor;
}
`;


// Canvas
const canvas = document.querySelector('webglGridShader')

// Scene
const scene = new THREE.Scene()

//Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const w = sizes.width / 5;
const h = sizes.height / 5;


//Geometry
const pgeometry = new THREE.PlaneGeometry(w, h, 1, 1);


// Materials
const gridmaterial = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        }
    },
    vertexShader: _gridVS,
    fragmentShader: _gridFS,
})


// Mesh
const plane = new THREE.Mesh(pgeometry, gridmaterial)
scene.add(plane)

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// Base camera
//const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
const camera = new THREE.OrthographicCamera( sizes.width / - 10, sizes.width / 10, sizes.height / 10, sizes.height / - 10, 1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 2
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Tick
const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()
    // Animate Material
    plane.material.uniforms.Time.value = clock.getElapsedTime()/2;

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
