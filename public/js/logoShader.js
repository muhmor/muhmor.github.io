import * as THREE from 'https://threejs.org/build/three.module.js';

const _colorSphereVS = `
varying vec3 v_Normal;
void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_Normal = normal;
}
`;

const _colorSphereFS = `
varying vec3 v_Normal;

void main(void)
{
    float fresnelValue = dot(v_Normal, vec3(0.0, 0.0, 1.0));
    fresnelValue = 1.0 - clamp(fresnelValue, 0.0, 1.0);
    vec3 col = mix(v_Normal, vec3(1.0, 1.0, 1.0), fresnelValue);
    //col += dot(v_Normal, vec3(0.8, 1.0, 0.5))+1.0;


    gl_FragColor = vec4(col, fresnelValue);
}
`;

const _lidSphereVS = `
varying vec3 v_Normal;

void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_Normal = normal;
}
`;

const _lidSphereFS = `
#define M_PI 3.1415926535897932384626433832795

varying vec3 v_Normal;

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle)
{
  angle /= 180.0;
  angle *= M_PI;
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}



vec4 calculateLid(vec3 normal, vec4 backColor, vec4 rimColor, float angle, float opacityHardness, float rimHardness, float topside)
{
  float rimCutoutEffect = 1.0;
  vec3 rotVector = rotate(vec3(0.0, 0.0, 1.0), vec3(-1.0, 0.0, 0.0), angle);

  float opacityFresnel = dot(normal, rotVector);
  opacityFresnel = 1.0 - clamp(opacityFresnel * opacityHardness, 0.0, 1.0);

  float rimFresnel = dot(normal, -rotVector);
  rimFresnel = 1.0 - clamp(rimFresnel, 0.0, 1.0);
  rimFresnel = pow(rimFresnel, rimHardness);

  vec3 rotVectorCutout;
  if(topside < 0.0)
  {
    rotVectorCutout = rotate(vec3(0.0, 0.0, 1.0), vec3(-1.0, 0.0, 0.0), angle - 90.0 - 45.0);

  }else
  {
    rotVectorCutout = rotate(vec3(0.0, 0.0, 1.0), vec3(-1.0, 0.0, 0.0), angle + (45.0 + 90.0));
  }

  float rimCutout = dot(normal, -rotVectorCutout);
  rimCutout = 1.0 - clamp(rimCutout, 0.0, 1.0);
  rimCutout = pow(rimCutout, rimHardness);
  rimCutout = 1.0 - rimCutout;
  rimColor = mix(backColor, rimColor, clamp(rimCutout + (1.0 - rimCutoutEffect), 0.0, 1.0));

  vec4 lid = mix(backColor, rimColor, rimFresnel);
  lid.w = opacityFresnel;

  return lid;
}

void main()
{
  vec4 backColor = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 rimColor = vec4(1.0, 1.0, 1.0, 1.0);

  float l1Angle = 45.0;
  float l2Angle = -45.0;

  vec4 topLid = calculateLid(v_Normal, backColor, rimColor, l1Angle, 50.0, 6.0, 1.0);
  vec4 bottomLid = calculateLid(v_Normal, backColor, rimColor, l2Angle, 50.0, 6.0, -1.0);

  float lidsLerp =  floor(dot(v_Normal, vec3(0.0, 1.0, 0.0)) + 1.0);
  vec4 lidsCombined = mix(bottomLid, topLid, lidsLerp);

  gl_FragColor = lidsCombined;
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
const pointMaterial = new THREE.PointsMaterial({
    size: 0.1
})
pointMaterial.color = new THREE.Color(0xffffff)


const colorSphereMat = new THREE.ShaderMaterial({
    vertexShader: _colorSphereVS,
    fragmentShader: _colorSphereFS,
})
colorSphereMat.transparent = true;
colorSphereMat.depthWrite = false;
colorSphereMat.depthTest = true;

const lidSphereMat = new THREE.ShaderMaterial({
    vertexShader: _lidSphereVS,
    fragmentShader: _lidSphereFS,
})
lidSphereMat.transparent = true;
lidSphereMat.depthWrite = false;
lidSphereMat.depthTest = true;


// Objects
const pointSphereGeometry = new THREE.SphereGeometry(1, 10, 10);
const colorSphereGeometry = new THREE.SphereGeometry(1.015, 32, 32);
const lidSphereGeometry = new THREE.SphereGeometry(1.02, 32, 32);

// Mesh
const sphereOb1 = new THREE.Points(pointSphereGeometry, pointMaterial);
scene.add(sphereOb1);
const sphereOb2 = new THREE.Points(pointSphereGeometry, pointMaterial);
scene.add(sphereOb2);

const colorSphere = new THREE.Mesh(colorSphereGeometry, colorSphereMat);
scene.add(colorSphere);

const lidSphere = new THREE.Mesh(lidSphereGeometry, lidSphereMat);
scene.add(lidSphere);

colorSphere.renderOrder = 1;
lidSphere.renderOrder = 2;

sphereOb1.parent = lidSphere;
sphereOb2.parent = lidSphere;
colorSphere.parent = lidSphere;

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

    colorSphere.rotation.z = rotValue;

    lidSphere.rotation.y = Math.sin(elapsedTime/ 2)*1.2;
    lidSphere.rotation.x = Math.sin(elapsedTime)/10;
    //lidSphere.rotation.y = elapsedTime;
    //lidSphere.rotation.y = Math.PI;
    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()

var MousePos = new THREE.Vector2(0,0);

document.addEventListener('mousemove', (event) => {
	MousePos = new THREE.Vector2(event.clientX, event.clientY);
});
