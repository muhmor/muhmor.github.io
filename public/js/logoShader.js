import * as THREE from 'https://threejs.org/build/three.module.js';

const _pivotVS = `
varying vec3 v_Normal;
void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_Normal = normal;
}
`;

const _pivotFS = `
varying vec3 v_Normal;

void main(void)
{
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const _irisVS = `
varying vec2 Uv;
void main(){
    Uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _irisFS = `
varying vec2 Uv;

void main(void)
{
    float iris = distance(vec2(0.5, 0.5), Uv);
    iris = 1.0 - iris * 10.0;
    iris *= 1.0;
    iris = clamp(iris, 0.0, 1.0);

    float iniris = distance(vec2(0.5, 0.5), Uv);
    iniris = 1.0 - iniris * 12.0;
    iniris *= 12.0;

    vec3 irisCol = mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), iniris);

    float beam =  Uv.y - 0.5;
    beam = clamp(abs(beam * 4.0), 0.0, 1.0);
    beam = 1.0 - beam;

    float beamClamper =  Uv.x - 0.5;
    beamClamper = clamp(abs(beamClamper * 2.0), 0.0, 1.0);
    beamClamper = 1.0 - beamClamper;

    beam *= beamClamper;
    beam = pow(beam * 1.2, 4.0);

    gl_FragColor = vec4(irisCol, iris + beam);
}
`;

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

uniform float Lid1Angle;
uniform float Lid2Angle;

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
  //rimColor = mix(backColor, rimColor, clamp(rimCutout + (1.0 - rimCutoutEffect), 0.0, 1.0));

  vec4 lid = mix(backColor, rimColor, rimFresnel);
  lid.w = opacityFresnel;

  return lid;
}

void main()
{
  vec4 backColor = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 rimColor = vec4(1.0, 1.0, 1.0, 1.0);

  vec4 topLid = calculateLid(v_Normal, backColor, rimColor, Lid1Angle, 50.0, 5.0, 1.0);
  vec4 bottomLid = calculateLid(v_Normal, backColor, rimColor, Lid2Angle, 50.0, 5.0, -1.0);

  float lidsLerp =  floor(dot(v_Normal, vec3(0.0, 1.0, 0.0)) + 1.0);
  vec4 lidsCombined = mix(bottomLid, topLid, lidsLerp);

  gl_FragColor = lidsCombined;
}
`;

// Canvas
const canvas = document.querySelector('canvas.LogoShader')

// Scene
const scene = new THREE.Scene()

const canvasScalar = 0.4;

//Sizes
const sizes = {
    width: Math.min(window.innerHeight*canvasScalar, document.body.clientWidth),
    height: Math.min(window.innerHeight*canvasScalar, document.body.clientWidth)
}

// Materials
const pointMaterial = new THREE.PointsMaterial({
    size: 0.1
})
pointMaterial.color = new THREE.Color(0xffffff)
pointMaterial.transparent = true;
pointMaterial.depthWrite = false;
pointMaterial.depthTest = true;

const colorSphereMat = new THREE.ShaderMaterial({
    vertexShader: _colorSphereVS,
    fragmentShader: _colorSphereFS,
})
colorSphereMat.transparent = true;
colorSphereMat.depthWrite = false;
colorSphereMat.depthTest = true;

const lidSphereMat = new THREE.ShaderMaterial({
    uniforms: {
        Lid1Angle: {
            value: 50
        },
        Lid2Angle: {
            value: -45
        },
    },
    vertexShader: _lidSphereVS,
    fragmentShader: _lidSphereFS,
})
lidSphereMat.transparent = true;
lidSphereMat.depthWrite = false;
lidSphereMat.depthTest = true;

const irisMat = new THREE.ShaderMaterial({
    vertexShader: _irisVS,
    fragmentShader: _irisFS,
})
irisMat.transparent = true;
irisMat.depthWrite = false;
irisMat.depthTest = true;

const pivotMat = new THREE.ShaderMaterial({
    vertexShader: _pivotVS,
    fragmentShader: _pivotFS,
})

// Objects
const pivotSphereGeometry = new THREE.SphereGeometry(0.17, 24, 24);
const pointSphereGeometry = new THREE.SphereGeometry(1, 10, 10);
const colorSphereGeometry = new THREE.SphereGeometry(1.015, 32, 32);
const lidSphereGeometry = new THREE.SphereGeometry(1.02, 32, 32);
const irisPlaneGeometry = new THREE.PlaneGeometry(2, 2, 1);

// Mesh
const pivotSphere = new THREE.Mesh(pivotSphereGeometry, pivotMat);
scene.add(pivotSphere);

const sphereOb1 = new THREE.Points(pointSphereGeometry, pointMaterial);
scene.add(sphereOb1);
const sphereOb2 = new THREE.Points(pointSphereGeometry, pointMaterial);
scene.add(sphereOb2);

const colorSphere = new THREE.Mesh(colorSphereGeometry, colorSphereMat);
scene.add(colorSphere);

const lidSphere = new THREE.Mesh(lidSphereGeometry, lidSphereMat);
scene.add(lidSphere);

const irisPlane = new THREE.Mesh(irisPlaneGeometry, irisMat);
scene.add(irisPlane);

sphereOb1.parent = pivotSphere;
sphereOb2.parent = pivotSphere;
colorSphere.parent = pivotSphere;
irisPlane.parent = pivotSphere;

irisPlane.renderOrder = 0;
sphereOb1.renderOrder = 1;
sphereOb2.renderOrder = 1;
colorSphere.renderOrder = 3;
lidSphere.renderOrder = 4;

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
  sizes.width = Math.min(window.innerHeight*canvasScalar, document.body.clientWidth);
  sizes.height = Math.min(window.innerHeight*canvasScalar, document.body.clientWidth);

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

function lerp(a, b, n) {
  n = Math.max(1, Math.min(n, 0));
  return (1 - n) * a + n * b;
}

//
var blinkTimer = 0;
var blinkLerp = 0;
var blinkEvery = 5;
var blink = false;


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

    //pivotSphere.rotation.y = Math.sin(elapsedTime/ 2)*0.5;
    //pivotSphere.rotation.x = Math.sin(elapsedTime)/10 + Math.sin(elapsedTime / 5)/10;

    //lidSphere.rotation.y = Math.sin(elapsedTime/ 2)*0.25;
    //lidSphere.rotation.x = Math.sin(elapsedTime)/5+ Math.sin(elapsedTime / 5)/5;
    ///
    lidSphere.rotation.y = elapsedTime + Math.PI;
    colorSphere.rotation.y = elapsedTime + Math.PI;
    lidSphere.material.uniforms.Lid1Angle.value = 0;
    lidSphere.material.uniforms.Lid2Angle.value = 0;
    //lidSphere.rotation.y = elapsedTime;
    //lidSphere.rotation.y = Math.PI;

    //lidSphere.scale.set(1,1,0.5);
    //lidSphere.material.uniforms.Lid1Angle.value = lerp(45, 90, elapsedTime);
    /*
    if(elapsedTime - blinkTimer > blinkEvery)
    {
      blink = true;
      blinkTimer = elapsedTime;
      blinkLerp = 0;
    }
    console.log(elapsedTime - blinkTimer);

    if(blink)
    {
        if(blinkLerp <= 1)
        {
          blinkLerp += clock.getDelta();
          lidSphere.material.uniforms.Lid1Angle.value = lerp(45, 90, blinkLerp);
        }
        else if(blinkLerp <= 2)
        {
          blinkLerp += clock.getDelta();
          lidSphere.material.uniforms.Lid1Angle.value = lerp(90, 45, blinkLerp);
        }
        else
        {
            blink = false;
        }
    }
    */
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
