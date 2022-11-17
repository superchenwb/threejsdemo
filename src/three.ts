import * as THREE from 'three';
import _ from 'lodash';
import AnyStats from 'three/examples/jsm/libs/stats.module';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { IPosition, IService } from './types';
import { store } from './model/service';

var renderer: THREE.WebGLRenderer;
function initRender() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  //告诉渲染器需要阴影效果
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.needsUpdate = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 默认的是，没有设置的这个清晰 THREE.PCFShadowMap
  document.body.appendChild(renderer.domElement);
}

const Stats: any = AnyStats;

var camera: THREE.PerspectiveCamera;
function initCamera() {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(30, 70, 140);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

var scene: THREE.Scene;
function initScene() {
  scene = new THREE.Scene();
}
let selectedObject: any = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function onPointerMove(event: any) {
  if (selectedObject) {
    selectedObject.material.color.set('#fff');
    selectedObject = null;
  }
  if (!camera) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObject(nodeGroup, true);

  if (intersects.length > 0) {
    const res = intersects.filter(function (res) {
      return res && res.object && !_.isEmpty(res.object.userData);
    })[0];

    if (res && res.object) {
      selectedObject = res.object;
      selectedObject.material.color.set('#ccc');
    }
  }
}
document.addEventListener('click', (event) => {
  if (selectedObject) {
    store.setCurrentService(selectedObject.userData);
  }
});
//初始化dat.GUI简化试验流程
const nodeGroup = new THREE.Group();
function initGui() {
  // const helper = new THREE.GridHelper(1000, 100, 0x303030, 0x303030);
  // helper.position.y = 0.1;
  // scene.add(helper);
  document.addEventListener('pointermove', onPointerMove);
}

function initLight() {
  // 环境光
  const ambientLight = new THREE.AmbientLight('#111111');
  scene.add(ambientLight);

  // 点光源
  let spotLight = new THREE.PointLight('#ffffff', 1, 450, 1);
  spotLight.position.set(100, 100, 100);

  //告诉平行光需要开启阴影投射
  // spotLight.castShadow = true;

  scene.add(spotLight);

  // 点光源
  spotLight = new THREE.PointLight('#ffffff', 1, 250, 1);
  spotLight.position.set(-80, 100, -10);

  //告诉平行光需要开启阴影投射
  // spotLight.castShadow = true;

  scene.add(spotLight);
}

const createText = (
  font: Font,
  color: string | number,
  message: string,
  size: number,
  position?: IPosition,
) => {
  const matLite = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
  });
  const shapes = font.generateShapes(message, size);
  const geometry = new THREE.ShapeGeometry(shapes);
  const text = new THREE.Mesh(geometry, matLite);
  if (position) {
    text.position.set(position.x, position.y || 0, position.z);
  }

  return text;
};

let font: Font;
const getFont = async () => {
  if (font) return font;
  const loader = new FontLoader();
  font = await new Promise((resolve, reject) => {
    loader.load('fonts/helvetiker_regular.typeface.json', resolve);
  });
};

/**
 * 创建指示灯
 */
const createPoint = (color: string) => {
  const group = new THREE.Group();
  // 指示灯
  const pointLight = new THREE.PointLight('#b7eb8f', 0.1, 100, 5);
  // 设置点光源的投射阴影
  pointLight.castShadow = true;
  group.add(pointLight);
  const pointLightMaterial = new THREE.MeshPhongMaterial({
    color: color,
    specular: 0x666666,
    emissive: 0xff0000,
    shininess: 10,
  });
  const pointLightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 80, 80), pointLightMaterial);
  pointLight.add(pointLightMesh);
  pointLightMesh.position.set(0, -1, 0);
  pointLight.position.set(-4, 3.5, -3);

  const update = (timer: number) => {
    pointLightMaterial.emissive.setHSL(0.24, 1, 0.35 * (0.5 + 0.5 * Math.cos(35 * timer)));
    pointLight.intensity = 0.35 * (0.5 + 0.5 * Math.cos(35 * timer));
  };

  return {
    update,
    group,
  };
};
/**
 * 创建服务节点
 */
const createServiceNode = (service: IService, position: IPosition) => {
  const height = service.data.cpu / 2;
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(10, height, 10);
  const material = new THREE.MeshPhongMaterial({ color: '#fff', transparent: false });
  const { update, group: pointGroup } = createPoint('green');
  const nodeMesh = new THREE.Mesh(geometry, material);
  // 启动阴影效果
  // nodeMesh.castShadow = true;
  // 接收阴影
  // nodeMesh.receiveShadow = true;
  const textGroup = new THREE.Group();
  if (font) {
    const text = createText(font, '#ccc', `name: ${service.name}`, 1, { x: -5, y: 0, z: -5 });
    textGroup.add(text);
    Object.entries(service.data).forEach(([key, value], index) => {
      const text = createText(font, '#ccc', `${key}: ${value}`, 1, {
        x: -5,
        y: 3 + index * 3,
        z: -5,
      });
      textGroup.add(text);
    });
  }
  nodeMesh.userData = service;
  pointGroup.position.y = height / 2 - 2.5;
  textGroup.position.y = height / 2 + 4;
  textGroup.position.z = position.z;
  textGroup.position.x = 0;
  group.add(textGroup);
  group.add(nodeMesh);
  group.add(pointGroup);
  group.position.set(position.x, height / 2, position.z);

  return {
    update,
    group,
  };
};

const createNodeGroup = (width: number, height: number) => {
  const group = new THREE.Group();
  //底部平面
  var planeGeometry = new THREE.PlaneGeometry(width, height, 20, 20);
  var planeMaterial = new THREE.MeshPhongMaterial({ color: 'grey' });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.y = 0.1;
  plane.position.z = 0;
  //告诉底部平面需要接收阴影
  plane.receiveShadow = true;
  group.add(plane);
  return group;
};

function initModel() {
  if (process.env.NODE_ENV === 'development') {
    //辅助工具
    var helper = new THREE.AxesHelper(40);
    scene.add(helper);
  }
  //底部平面
  var planeGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
  var planeMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.y = -0;

  //告诉底部平面需要接收阴影
  plane.receiveShadow = true;
  scene.add(plane);
}

//初始化性能插件
var stats: any;
function initStats() {
  stats = new Stats();
  document.body.appendChild(stats.dom);

  return {
    update: () => {
      //更新性能插件
      stats.update();
    },
  };
}

//用户交互插件 鼠标左键按住旋转，右键按住平移，滚轮缩放
var controls: OrbitControls;
function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);

  // 如果使用animate方法时，将此函数删除
  //controls.addEventListener( 'change', render );
  // 使动画循环使用时阻尼或自转 意思是否有惯性
  controls.enableDamping = true;
  //动态阻尼系数 就是鼠标拖拽旋转灵敏度
  //controls.dampingFactor = 0.25;
  //是否可以缩放
  controls.enableZoom = true;
  //是否自动旋转
  controls.autoRotate = false;
  //设置相机距离原点的最远距离
  controls.minDistance = 50;
  //设置相机距离原点的最远距离
  controls.maxDistance = 200;
  //是否开启右键拖拽
  controls.enablePan = true;
}

function render() {
  renderer.render(scene, camera);
}

//窗口变动触发的函数
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  render();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const list = [
  {
    group: 'fw-platform-app',
    name: 'fw-platform-app1',
    data: {
      cpu: 80,
      'connections max': '60',
      timeout: '1ms',
      threads: 200,
    },
  },
  {
    group: 'fw-platform-app',
    name: 'fw-platform-app2',
    data: {
      cpu: 90,
      'connections max': '60',
      timeout: '1ms',
      threads: 200,
    },
  },
  {
    group: 'fw-platform-app',
    name: 'fw-platform-app3',
    data: {
      cpu: 20,
      'connections max': '60',
      timeout: '1ms',
      threads: 200,
    },
  },
  {
    group: 'fw-notification-app',
    name: 'fw-notification-app',
    data: {
      cpu: 60,
      'connections max': '60',
      timeout: '1ms',
      threads: 200,
    },
  },
  {
    group: 'fw-notification-app',
    name: 'fw-notification-app2',
    data: {
      cpu: 60,
      'connections max': '60',
      timeout: '1ms',
      threads: 200,
    },
  },
  {
    group: 'test',
    name: 'test-app',
    data: {
      cpu: 60,
      'connections max': '60',
      timeout: '1ms',
      threads: 200,
    },
  },
];
let updates: Function[] = [];
function animate() {
  const timer = 0.0001 * Date.now();
  //更新控制器
  render();

  controls.update();
  updates.forEach((fn) => fn(timer));

  requestAnimationFrame(animate);
}

async function draw() {
  initRender();
  initScene();
  initGui();
  await getFont();
  const groups = _.groupBy(list, 'group');
  let maxServiceLen = 0;
  Object.values(groups).forEach((value) => (maxServiceLen = Math.max(maxServiceLen, value.length)));
  const planeWidth = maxServiceLen * 25;
  const entries = Object.entries(groups);
  entries.forEach(([key, value], i) => {
    const plane = createNodeGroup(planeWidth, 30);
    plane.position.z = -i * 40 + (entries.length * 20) / 2;
    const text = createText(font, '#fff', `service: ${key}`, 1.5, {
      x: -35,
      y: 0.2,
      z: 12,
    });
    text.rotation.x = -0.5 * Math.PI;
    plane.add(text);
    nodeGroup.add(plane);
    updates.push(
      ...value.map((app, index) => {
        const { update, group } = createServiceNode(app, {
          x: index * 18 - 15,
          z: 0,
        });
        plane.add(group);
        return update;
      }),
    );
  });
  scene.add(nodeGroup);
  initCamera();
  initLight();
  initModel();
  initControls();
  if (process.env.NODE_ENV === 'development') {
    const { update } = initStats();
    updates.push(update);
  }

  animate();
  window.onresize = onWindowResize;
}

draw();
