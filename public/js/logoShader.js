import * as THREE from 'https://threejs.org/build/three.module.js';

const _fresnelVS = `
varying vec3 v_Normal;
void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_Normal = normal;
}
`;

const _fresnelFS = `
varying vec3 v_Normal;

void main(void)
{
    float fresnelValue = dot(v_Normal, vec3(0.0, 0.0, 1.0));
    fresnelValue = 1.0 - clamp(fresnelValue, 0.0, 1.0);
    vec3 col = mix(v_Normal, vec3(1.0, 1.0, 1.0), fresnelValue);

    float inverseFresnel = dot(v_Normal, vec3(0.0, 0.0, -1.0));
    inverseFresnel = 1.0 - clamp(inverseFresnel, 0.0, 1.0);;
    col *= pow(inverseFresnel, 4.0);

    gl_FragColor = vec4(col, fresnelValue);
}
`;

// Canvas
const canvas = document.querySelector('canvas.LogoShader')

// Scene
const scene = new THREE.Scene()

//Sizes
const sizes = {
    width: document.body.clientWidth/2,
    height: window.innerHeight/2
}

// Materials
const pmaterial = new THREE.PointsMaterial({
    size: 0.02
})

pmaterial.color = new THREE.Color(0xffffff)

const fmaterial = new THREE.ShaderMaterial({
    vertexShader: _fresnelVS,
    fragmentShader: _fresnelFS,
})
fmaterial.transparent = true;

const ffmaterial = new THREE.MeshBasicMaterial()
ffmaterial.color = new THREE.Color(0xffffff)
// Objects
const spheregeometry = new THREE.SphereGeometry(1, 10, 10);
const fspheregeometry = new THREE.SphereGeometry(1.015, 32, 32);

// Mesh
const sphereOb1 = new THREE.Points(spheregeometry,pmaterial);
scene.add(sphereOb1);
const sphereOb2 = new THREE.Points(spheregeometry,pmaterial);
scene.add(sphereOb2);

const fsphereOb1 = new THREE.Mesh(fspheregeometry,fmaterial);
scene.add(fsphereOb1);

// Base camera
const camera = new THREE.PerspectiveCamera(10, sizes.width / sizes.height, 0.1, 100000)
//const camera = new THREE.OrthographicCamera( sizes.width/ -2, sizes.width/ 2, sizes.height/ 2, sizes.height/ -2, 1, sizes.width/2);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 20;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Resize to viewport
window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

function ResizeCameraAndRenderer()
{
  // Update sizes
  sizes.width = document.body.clientWidth/2;
  sizes.height = document.body.clientWidth/2;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update logo points size
  //sphereOb1.material.uniforms.size.value = 1;

}
ResizeCameraAndRenderer();

// Tick
const clock = new THREE.Clock()

const tick = () =>
{
    // Time
    const elapsedTime = clock.getElapsedTime()

    // Logo animation
    var rotSpeed = 2;
    var rotValue = elapsedTime * rotSpeed;

    sphereOb1.rotation.y = rotValue;
    sphereOb1.rotation.x = rotValue;

    sphereOb2.rotation.y = rotValue;
    sphereOb2.rotation.x = -rotValue;

    //fsphereOb1.rotation.y = Math.sin(rotValue/3);
    fsphereOb1.rotation.y = rotValue/3;
    fsphereOb1.rotation.z = rotValue;

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
