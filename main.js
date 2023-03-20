import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { Octree } from "three/examples/jsm/math/Octree.js";
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
/*socket建立连接*/
import io from 'socket.io-client'
const socket = io('ws://localhost:5173');
/*Three初始化场景*/
//全局变量
const GRAVITY = 30;
const onfloor = false
const worldOctree = new Octree();
//场景
const scene = new THREE.Scene();
//摄像机
const SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
const VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.3, FAR = 1000;
const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0, 20, 50);
camera.lookAt(new THREE.Vector3(0, 15, 0));
scene.add(camera);
//渲染器
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
document.body.appendChild(renderer.domElement);
//灯光
const light = new THREE.AmbientLight( 0xaaaaaa );
scene.add( light );
//添加物体
  //1）天空盒
      // 1.1)首先创建一个盒子立方体，长宽高设为500
const skyBoxGeometry = new THREE.BoxGeometry(500, 500, 500);
      // 1.2)接下来创建材质并映射到指定图片，设定为只渲染背面（对立方体来说，从外面看到的是正面，从内部看到的是背面）
const textureLoader = new THREE.TextureLoader();
const skyBoxMaterial = [
        new THREE.MeshBasicMaterial({map: textureLoader.load('./public/skybox/px.jpg'), side: THREE.BackSide}), // right
        new THREE.MeshBasicMaterial({map: textureLoader.load('./public/skybox/nx.jpg'), side: THREE.BackSide}), // left
        new THREE.MeshBasicMaterial({map: textureLoader.load('./public/skybox/py.jpg'), side: THREE.BackSide}), // top
        new THREE.MeshBasicMaterial({map: textureLoader.load('./public/skybox/ny.jpg'), side: THREE.BackSide}), // bottom
        new THREE.MeshBasicMaterial({map: textureLoader.load('./public/skybox/pz.jpg'), side: THREE.BackSide}), // back
        new THREE.MeshBasicMaterial({map: textureLoader.load('./public/skybox/nz.jpg'), side: THREE.BackSide})  // front
];
// 1.3)创建天空盒子并添加到场景
const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
scene.add(skyBox);
//2)地面
textureLoader.load("./public/floor/floor.jpg", function (texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  const floorMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
  });
  const floorGeometry = new THREE.PlaneGeometry(500, 500, 5, 5);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = 0;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);
})
//实现"响应式照相机"
window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
//------------------------------------------------------------------------------------
/*------1）外部模型导入-------*/
//模型导入函数
function  gLTFLoaderEX(name,scaleX,scaleY,scaleZ){
  const loader = new GLTFLoader();
  const url="./public/"+"model/"+name+".glb"
  loader.load(url, 
    function ( gltf ) {
      gltf.scene.scale.set(scaleX,scaleY,scaleZ)
      scene.add(gltf.scene);
    }
  )
}
//NPC模型
let NPC = null
const loader = new GLTFLoader();
loader.load("./public/model/npc.glb", 
  function ( gltf ) {
    NPC = gltf
    // console.log('内',gltf)
    console.log('内',gltf.scene)
    gltf.scene.scale.set(3,3,3)
    scene.add(gltf.scene);
  }
)
console.log('外',NPC)
//场景模型
// gLTFLoaderEX('collision-world',5,5,5)
/*------2）控制移动-------*/
// 监听键盘是否按下
let keyCodeW = false
let keyCodeS = false
let keyCodeA = false
let keyCodeD = false
document.addEventListener(
  'keydown',
  (e) => {
    console.log('keydown')
    var ev = e || window.event
    switch (ev.keyCode) {
      case 87:
        keyCodeW = true
        break
      case 83:
        keyCodeS = true
        break
      case 65:
        keyCodeA = true
        break
      case 68:
        keyCodeD = true
        break
      default:
        break
    }
  },
  false
)
document.addEventListener(
  'keyup',
  (e) => {
    console.log('keyup')
    var ev = e || window.event
    switch (ev.keyCode) {
      case 87:
        keyCodeW = false
        break
      case 83:
        keyCodeS = false
        break
      case 65:
        keyCodeA = false
        break
      case 68:
        keyCodeD = false
        break
      default:
        break
    }
  },
  false
)
// 控制 移动
function onCodeMove(mesh) {
  if (keyCodeW) {
    mesh.position.x += 0.5
    // camera.position.x += 0.5
    // dirLight.position.x += 2
    mesh.rotation.y = Math.PI * 0.5
  }
  if (keyCodeA) {
    mesh.position.z -= 0.5
    // camera.position.z -= 0.5
    // dirLight.position.z -= 2
    mesh.rotation.y = Math.PI
  }
  if (keyCodeS) {
    mesh.position.x -= 0.5
    // camera.position.x -= 0.5
    // dirLight.position.x -= 2
    mesh.rotation.y = Math.PI * 1.5
  }
  if (keyCodeD) {
    mesh.position.z += 0.5
    // camera.position.z += 0.5
    // dirLight.position.z += 2
    mesh.rotation.y = Math.PI * 2
  }

  if (keyCodeW && keyCodeD) {
    mesh.rotation.y = Math.PI * 0.25
  }
  if (keyCodeW && keyCodeA) {
    mesh.rotation.y = Math.PI * 0.75
  }
  if (keyCodeA && keyCodeS) {
    mesh.rotation.y = Math.PI * 1.25
  }
  if (keyCodeS && keyCodeD) {
    mesh.rotation.y = Math.PI * 1.75
  }else {
    resetMove()
  }
}
let moveNum = false
// 重置移动
function resetMove() {
  // 按下键盘 跑步动画
  if (keyCodeW || keyCodeS || keyCodeA || keyCodeD) {
    moveNum = true
  } else {
    // 只执行一次
    if (moveNum) {
      moveNum = false
    }
  }
} 
/*------3）多人交互-------*/
let playerMap = new Map();
socket.on('player', data => {
  console.log(data)
  if (playerMap.has(data.socketid)) {
    let model = playerMap.get(data.socketid);
    model.position.set(data.position.x, data.position.y, data.position.z);
    model.rotation.set(data.rotation._x, data.rotation._y + Math.PI / 2, data.rotation._z);
  } else {
    socket.emit('player', {position: NPC.scene.position, rotation: NPC.scene.rotation});
    // const loader = new GLTFLoader();
    loader.load("./public/model/npc.glb", (mesh) => {
      //如果这个判断注释掉会怎么样，为什么
      if(!playerMap.has(data.socketid)) {
        mesh.scene.scale.set(10, 10, 10);
				scene.add(mesh.scene);
				playerMap.set(data.socketid, mesh.scene);
      }
    });
  }
});
socket.on('offline', data => {
  if (playerMap.has(data.socketid)) {
    scene.remove(playerMap.get(data.socketid));
    playerMap.delete(data.socketid)
  }
});
/*------4）NPC对话交互模块-------*/
const texture1 = new THREE.TextureLoader().load( './public/textures/1.PNG' );
const geometry1 = new THREE.BoxGeometry( 5, 5, 5 );
const material1 = new THREE.MeshBasicMaterial( {
  // color: 0xE9967A,
  map: texture1
} );
const cube1 = new THREE.Mesh( geometry1, material1 );
cube1.position.set(-6,3,6)
scene.add( cube1 );
cube1.name = 'click'      
let intersects = []; //几何体合集
const pointer = new THREE.Vector2();
document.addEventListener( 'mousedown', meshOnClick );
let raycaster = new THREE.Raycaster();
function meshOnClick(event) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera( pointer, camera );
  //geometrys为需要监听的Mesh合集，可以通过这个集合来过滤掉不需要监听的元素例如地面天空
  //true为不拾取子对象
  intersects = raycaster.intersectObjects( scene.children);
  //被射线穿过的几何体为一个集合，越排在前面说明其位置离端点越近，所以直接取[0]
  if ( intersects.length > 0 ) {
    if ( intersects[0].object.name == 'click'){
      alert('我被点击了');
      // initDragControls()
      // console.log(intersects[0].object);
    }
  } else {
    // console.log('未监听到');
    //若没有几何体被监听到，可以做一些取消操作
  }
}  
/*------5）场景组件自定义布局-------*/
const texture2 = new THREE.TextureLoader().load( './public/textures/2.PNG' );
const geometry = new THREE.BoxGeometry( 5, 4, 5 );
const material = new THREE.MeshBasicMaterial( {
  // color: 0xE9967A,
  map: texture2
} );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(16,3,6)
scene.add( cube );

function initDragControls() {
  // 添加平移控件
  var transformControls = new TransformControls(camera, renderer.domElement);
  scene.add(transformControls);

  // 过滤不是 Mesh 的物体,例如辅助网格对象
  var objects = [];
  objects.push(cube)
  //全部物体
  // for (let i = 0; i < scene.children.length; i++) {
  //     if (scene.children[i].isMesh) {
  //         objects.push(scene.children[i]);
  //     }
  // }
  // 初始化拖拽控件
  var dragControls = new DragControls(objects, camera, renderer.domElement);

  // 鼠标略过事件
  dragControls.addEventListener('hoveron', function (event) {
      // 让变换控件对象和选中的对象绑定
      transformControls.attach(event.object);
  });
  // 开始拖拽
  dragControls.addEventListener('dragstart', function (event) {
      controls.enabled = false;
  });
  // 拖拽结束
  dragControls.addEventListener('dragend', function (event) {
      controls.enabled = true;
  });
}
initDragControls()         
//------------------------------------------------------------------------------------
//回调函数
let deltaTime = new THREE.Clock()
function render() {
  //为啥子在if()判断里就可以识别到NPC.scene
  if (NPC) {
    //1)重力问题
    if (!onfloor){
      // NPC.scene.position.y -= GRAVITY * deltaTime;
    }
    //2)移动
    onCodeMove(NPC.scene)
    // console.log(NPC.scene)  
    //3)广播
    socket.emit('player', {position: NPC.scene.position, rotation: NPC.scene.rotation});
  }
  controls.update()
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();