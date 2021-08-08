import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { Color } from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


const vShader = `
#define PI 3.14159265359
#define TAU 2.0 * PI

uniform float u_time;

varying vec2 v_uv;
varying vec3 v_color;

float inverseLerp(float a, float b, float v){
    return (v-a)/(b-a);
}

mat3 rotateX(float theta){
    mat3 rotationMat = mat3(1.0, 0.0, 0.0,
                            0.0, cos(theta), -sin(theta),
                            0.0, sin(theta), cos(theta) );
    return rotationMat;
}

vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

void main() {
    vec2 st = vec2(uv*10.0);
    st.x += u_time;
    v_uv = uv;
    v_color = vec3(noise(st)*1.3+.5);
    vec3 newPos = vec3(uv*2.-1., 0.);
    newPos = vec3(uv*2.-1., v_color.z * .15);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);

}
`
const fShader = `
#define PI 3.14159265359
#define TAU 2.0 * PI

varying vec2 v_uv;
varying vec3 v_color;

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform float u_time;

float inverseLerp(float a, float b, float v){
    return (v-a)/(b-a);   
}

void main() {
    vec2 v = u_mouse / u_resolution;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 color = vec3(0.0);

    color = v_color;
    if(color.x < 0.3){
        color = vec3(0., 0., .8);
    }
    else if(color.x >= 0.3 && color.x < .5){
        color = vec3(.15625, .453125, .08203125);
    }
    else if(color.x > .5 && color.x < .8){
        color = vec3(.203125, .0703125, .03515625);
    }

    gl_FragColor = vec4(color, 1.0);
}
`

// shader uniforms
const uniforms = {
    u_mouse: { value: { x: window.innerWidth / 2, y: window.innerHeight / 2 } },
    u_resolution: { value: { x: window.innerWidth, y: window.innerHeight } },
    u_time: { value: 0.0 },
    u_color: { value: new THREE.Color(0xFF0000) }
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new Color(.2, .2, .2);

// Objects
const width = 100;
const height = 100;
const divisions = .95;
const geometry = new THREE.PlaneGeometry(width, height, width * divisions, height* divisions);
const torus = new THREE.TorusGeometry(2, 1, 32, 16);

// Materials

const material = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms
});

const torusMat = new THREE.MeshPhongMaterial();
torusMat.color = new Color(1, 0, 0);

// Mesh
// const sphere = new THREE.Mesh(torus,torusMat);
// scene.add(sphere)
const plane = new THREE.Mesh(geometry, material);
plane.position.x = 0;
plane.position.y = 0;
plane.position.z = 0;
plane.rotation.x = -90;
scene.add(plane);

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

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

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 5;
camera.position.z = 1;
scene.add(camera)

// Debug
const gui = new dat.GUI();

const cameraFolder = gui.addFolder('Camera');
const cameraTranslate = cameraFolder.addFolder("translate");
cameraTranslate.add(camera.position, 'x').min(-25).max(25).step(.01);
cameraTranslate.add(camera.position, 'y').min(-25).max(25).step(.01);
cameraTranslate.add(camera.position, 'z').min(0).max(1000).step(.0001);
const cameraRotate = cameraFolder.addFolder("rotate");
cameraRotate.add(camera.rotation, 'x').min(0).max(Math.PI*2).step(.001);
cameraRotate.add(camera.rotation, 'y').min(0).max(Math.PI*2).step(.001);
cameraRotate.add(camera.rotation, 'z').min(0).max(Math.PI*2).step(.001);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true

/**
 * Animate
 */
// const controller = new THREE.OrbitControls(camera, renderer.domElement);

const clock = new THREE.Clock()

const tick = () =>
{
    uniforms.u_time.value = clock.getElapsedTime();
    const elapsedTime = clock.getElapsedTime()

    // Update objects
    // sphere.rotation.y = .5 * elapsedTime

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()