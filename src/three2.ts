import * as THREE from 'three';
import _ from 'lodash';
import TWEEN from '@tweenjs/tween.js';
import AnyStats from 'three/examples/jsm/libs/stats.module';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { IPosition, IService } from './types';
import { store } from './model/service';
import { Shape } from 'three';

const Stats = AnyStats;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#fff');
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// const light = new THREE.DirectionalLight('#fff', 0.7);
// scene.add(light);

// // const light = new THREE.PointLight('#ccc', 2, 50);
// light.position.set(5, 10, 5);
// // scene.add(light);
// const sphereSize = 1;
// const pointLightHelper = new THREE.DirectionalLightHelper(light, sphereSize);
// scene.add(pointLightHelper);

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
    loader.load('./fonts/helvetiker_regular.typeface.json', resolve);
  });
};

const SIZE = 1;
const databaseGroundSize = SIZE * 6;
// 初始化一个加载器
const loader = new THREE.TextureLoader();
const createBaseNode = (color: string = '#eee', size = SIZE, height = SIZE) => {
  const geometry = new THREE.BoxGeometry(size, height, size);
  const normal = new THREE.MeshBasicMaterial({ color });
  const materials = [normal, normal, normal, normal, normal, normal];
  const cube = new THREE.Mesh(geometry, materials);

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#ccc' }));
  cube.add(line);
  cube.position.y = height / 2;
  return cube;
};
const createDatabaseNode = () => {
  const color = '#444';
  const node = createBaseNode(color);
  // 加载一个资源
  const texture = loader.load('./images/data.png');
  (node.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
    color,
    map: texture,
  });
  return node;
};

const createBasePlane = (
  shape: THREE.Shape,
  color: string,
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
  texture?: THREE.Texture,
) => {
  let geometry = new THREE.ShapeGeometry(shape);
  let mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      map: texture,
      combine: THREE.AddOperation,
    }),
  );
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
};

const matLines: LineMaterial[] = [];
// 初始化线路
function createLine(points: number[], linewidth = 1, color?: number) {
  const geometry = new LineGeometry();
  geometry.setPositions(points);
  const material = new LineMaterial({
    color,
    linewidth: linewidth,
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true,
  });
  matLines.push(material);
  const line = new Line2(geometry, material);
  line.computeLineDistances();
  line.position.y = 0.08;
  return line;
}

const createEdges = (pArr: { x: number; y: number; z: number }[]) => {
  const points: number[] = [];
  for (var i = 0; i < pArr.length; i++) {
    points.push(pArr[i].x, pArr[i].y, pArr[i].z);
  }
  const edges = createLine(points, 1.5, 0x000000);
  return edges;
};

const createDatabaseGroup = () => {
  const group = new THREE.Group();
  const node1 = createDatabaseNode();
  group.add(node1);

  const node2 = createDatabaseNode();
  node2.position.z = -SIZE * 1.5;
  group.add(node2);

  const node3 = createDatabaseNode();
  node3.position.z = -SIZE * 1.5 * 2;
  group.add(node3);

  const gateway = createGatewayNode();
  gateway.position.x = SIZE * 2;
  gateway.position.z = -SIZE * 1.5;
  group.add(gateway);
  const startPoint = {
    x: -(SIZE + SIZE / 2),
    y: 0,
    z: SIZE + SIZE / 2,
  };
  const pArr = [
    startPoint,
    {
      x: startPoint.x + SIZE * 3 - 0.4,
      y: 0,
      z: startPoint.z,
    },
    {
      x: startPoint.x + SIZE * 3 - 0.2,
      y: 0,
      z: startPoint.z - 0.1,
    },
    {
      x: SIZE * 3 + 0.4,
      y: 0,
      z: -0.2,
    },
    {
      x: SIZE * 3 + SIZE / 2,
      y: 0,
      z: -SIZE / 2,
    },
    {
      x: SIZE * 3 + SIZE / 2,
      y: 0,
      z: -(SIZE * 3),
    },
    {
      x: SIZE * 3 + 0.4,
      y: 0,
      z: -(SIZE * 3) - 0.2,
    },
    {
      x: startPoint.x + SIZE * 4 - 0.2,
      y: 0,
      z: -(SIZE * 4.5 - 0.1),
    },
    {
      x: startPoint.x + SIZE * 4 - 0.4,
      y: 0,
      z: -SIZE * 4.5,
    },
    {
      x: -SIZE * 1.5,
      y: 0,
      z: -SIZE * 4.5,
    },
    {
      x: -SIZE * 2,
      y: 0,
      z: -SIZE * 4,
    },
    {
      x: -SIZE * 2,
      y: 0,
      z: SIZE,
    },
    startPoint,
  ];
  const points: number[] = [];
  for (var i = 0; i < pArr.length; i++) {
    var randomX = pArr[i].x;
    var randomY = pArr[i].y;
    var randomZ = pArr[i].z;
    points.push(randomX, randomY, randomZ);
  }
  const line = createLine(points, 1, 0x000000);
  group.add(line);
  const pArr2 = [
    { x: 0, y: 0, z: 0 },
    {
      x: 1.25,
      y: 0,
      z: 0,
    },
    {
      x: 1.5,
      y: 0,
      z: -0.25,
    },
    {
      x: 1.5,
      y: 0,
      z: -1.5,
    },
  ];
  const edges2 = createEdges(pArr2);
  group.add(edges2);
  const pArr3 = [
    { x: 0, y: 0, z: -3 },
    {
      x: 1.25,
      y: 0,
      z: -3,
    },
    {
      x: 1.5,
      y: 0,
      z: -2.75,
    },
    {
      x: 1.5,
      y: 0,
      z: -1.5,
    },
  ];
  const edges3 = createEdges(pArr3);
  group.add(edges3);

  const pArr4 = [
    { x: 0, y: 0, z: -1.5 },
    {
      x: 5,
      y: 0,
      z: -1.5,
    },
  ];
  const edges4 = createEdges(pArr4);
  group.add(edges4);

  const geometry = new THREE.CircleGeometry(0.25, 32);
  const lock = loader.load('./images/lock.png');
  const material = new THREE.MeshBasicMaterial({ color: '#333', map: lock });
  const circle = new THREE.Mesh(geometry, material);
  circle.rotation.x = -0.5 * Math.PI;
  circle.position.x = 5;
  circle.position.z = -1.5;
  circle.position.y = 0.1;
  group.add(circle);

  const squareShape = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 5)
    .lineTo(3.5, 5)
    .lineTo(4.5, 4)
    .lineTo(4.5, 1.5)
    .lineTo(2.6, 0)
    .lineTo(0, 0);
  const mesh = createBasePlane(squareShape, '#ccc', -1.5, 0, 1, -0.5 * Math.PI, 0, 0);
  mesh.position.y = 0.06;
  group.add(mesh);

  const shape2 = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 0.8)
    .lineTo(0.2, 1)
    .lineTo(2, 1)
    .lineTo(2.2, 0.8)
    .lineTo(2.2, 0)
    .lineTo(0, 0);
  const texture = loader.load('./images/server.png');
  const mesh2 = createBasePlane(shape2, '#111', -1.5, 0, 1.5, 0.5 * Math.PI, 0, 0, texture);
  mesh2.position.y = 0.06;
  group.add(mesh2);
  if (font) {
    const text = createText(font, '#000', `Corporate Data Center`, SIZE * 0.3, {
      x: -1.5 * SIZE - 0.1,
      y: 0.1,
      z: 0.5 * SIZE,
    });
    text.rotation.x = -0.5 * Math.PI;
    text.rotation.z = 0.5 * Math.PI;
    group.add(text);

    const text2 = createText(font, '#000', `Proprietary Data`, SIZE * 0.2, {
      x: -1 * SIZE,
      y: 0.1,
      z: SIZE - 0.1,
    });
    text2.rotation.x = -0.5 * Math.PI;
    group.add(text2);
  }
  group.position.z = groundWidth / 2 - SIZE / 2;
  group.position.x = -SIZE * 3.5;
  return group;
};

const createGatewayNode = () => {
  const group = new THREE.Group();
  const color = '#444';
  const node = createBaseNode(color, SIZE, 0.5);
  // 加载一个资源
  const texture = loader.load('./images/gateway.png');
  (node.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
    color,
    map: texture,
  });
  group.add(node);

  if (font) {
    const text = createText(font, '#000', `Customer\nGateway`, SIZE * 0.2, {
      x: -0.1,
      y: 0.1,
      z: -1 * SIZE,
    });
    text.rotation.x = -0.5 * Math.PI;
    text.rotation.z = 0.5 * Math.PI;
    group.add(text);
  }
  return group;
};

const createLockNode = () => {
  const vertices = [
    // front
    { pos: [0, 1, 0], norm: [0, 0, 1], uv: [0, 1] },
    { pos: [0, 0, 0], norm: [0, 0, 1], uv: [1, 1] },
    { pos: [0.8, 0, -0.2], norm: [0, 0, 1], uv: [0, 0] },

    { pos: [0.8, 0, -0.2], norm: [0, 0, 1], uv: [0, 0] },
    { pos: [0.8, 0.5, -0.2], norm: [0, 0, 1], uv: [1, 1] },
    { pos: [0, 1, 0], norm: [0, 0, 1], uv: [1, 0] },
    // right
    { pos: [0.8, 0.5, -0.2], norm: [1, 0, 0], uv: [0, 1] },
    { pos: [0.8, 0, -0.2], norm: [1, 0, 0], uv: [1, 1] },
    { pos: [0.8, 0, -0.4], norm: [1, 0, 0], uv: [0, 0] },

    { pos: [0.8, 0, -0.4], norm: [1, 0, 0], uv: [0, 0] },
    { pos: [0.8, 0.5, -0.4], norm: [1, 0, 0], uv: [1, 1] },
    { pos: [0.8, 0.5, -0.2], norm: [1, 0, 0], uv: [1, 0] },
    // back
    { pos: [0.8, 0, -0.4], norm: [0, 0, -1], uv: [1, 1] },
    { pos: [0, 0, -0.6], norm: [0, 0, -1], uv: [0, 1] },
    { pos: [0.8, 0.5, -0.4], norm: [0, 0, -1], uv: [0, 0] },

    { pos: [0.8, 0.5, -0.4], norm: [0, 0, -1], uv: [0, 0] },
    { pos: [0, 0, -0.6], norm: [0, 0, -1], uv: [1, 0] },
    { pos: [0, 1, -0.6], norm: [0, 0, -1], uv: [1, 1] },
    // left
    { pos: [0, 0, -0.6], norm: [-1, 0, 0], uv: [0, 1] },
    { pos: [0, 0, 0], norm: [-1, 0, 0], uv: [1, 1] },
    { pos: [0, 1, 0], norm: [-1, 0, 0], uv: [0, 0] },

    { pos: [0, 1, 0], norm: [-1, 0, 0], uv: [0, 0] },
    { pos: [0, 1, -0.6], norm: [-1, 0, 0], uv: [1, 1] },
    { pos: [0, 0, -0.6], norm: [-1, 0, 0], uv: [1, 0] },
    // top
    { pos: [0.8, 0.5, -0.2], norm: [0, 1, 0], uv: [1, 1] },
    { pos: [0.8, 0.5, -0.4], norm: [0, 1, 0], uv: [0, 1] },
    { pos: [0, 1, 0], norm: [0, 1, 0], uv: [0, 0] },

    { pos: [0, 1, -0.6], norm: [0, 1, 0], uv: [1, 1] },
    { pos: [0, 1, 0], norm: [0, 1, 0], uv: [0, 0] },
    { pos: [0.8, 0.5, -0.4], norm: [0, 1, 0], uv: [1, 0] },
    // bottom
    { pos: [0.8, 0, -0.2], norm: [0, -1, 0], uv: [1, 1] },
    { pos: [0, 0, 0], norm: [0, -1, 0], uv: [0, 1] },
    { pos: [0.8, 0, -0.4], norm: [0, -1, 0], uv: [0, 0] },

    { pos: [0, 0, -0.6], norm: [0, -1, 0], uv: [1, 1] },
    { pos: [0.8, 0, -0.4], norm: [0, -1, 0], uv: [0, 0] },
    { pos: [0, 0, 0], norm: [0, -1, 0], uv: [1, 0] },
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  for (const vertex of vertices) {
    positions.push(...vertex.pos);
    normals.push(...vertex.norm);
    uvs.push(...vertex.uv);
  }

  const geometry = new THREE.BufferGeometry();
  const positionNumComponents = 3;
  const normalNumComponents = 3;
  const uvNumComponents = 2;
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents),
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents),
  );
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
  const normal = new THREE.MeshBasicMaterial({ color: '#ccc' });

  const mesh = new THREE.Mesh(geometry, normal);
  const group = new THREE.Group();

  group.add(mesh);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#333' }));
  group.add(line);
  group.position.y = 0.1;
  return group;
};

const groundWidth = SIZE * 12;
const groundHeight = SIZE * 16;
const createGround = () => {
  const group = new THREE.Group();

  const geometry = new THREE.BoxGeometry(groundWidth, groundHeight, 0.1);
  const material = new THREE.MeshBasicMaterial({ color: '#fff' });
  const plane = new THREE.Mesh(geometry, material);
  loader.load('./images/grid.png', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(groundWidth, groundHeight);
    material.map = texture;
    material.needsUpdate = true;
  });
  group.add(plane);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#ccc' }));
  plane.add(line);
  plane.rotation.x = -0.5 * Math.PI;
  return group;
};

const createLockGroup = () => {
  const group = new THREE.Group();
  const lock = createLockNode();
  lock.position.x = 0.1;
  group.add(lock);

  const lock2 = createLockNode();
  lock2.rotation.y = -Math.PI;
  lock2.position.z = -0.6;
  lock2.position.x = -0.1;
  group.add(lock2);
  group.position.z = 0.2;
  return group;
};

const createCloud = () => {
  const group = new THREE.Group();
  const lockGroup = createLockGroup();

  group.add(lockGroup);
  group.position.x = 3;
  group.position.z = 2;

  const pArr3 = [
    { x: 0, y: 0, z: 0.5 },
    {
      x: -1.25,
      y: 0,
      z: 1.9,
    },
  ];
  const edges3 = createEdges(pArr3);
  group.add(edges3);

  const pArr4 = [
    { x: 0, y: 0, z: 0.5 },
    { x: 0, y: 0, z: -2 },
  ];
  const edges4 = createEdges(pArr4);
  group.add(edges4);

  const startPoint = {
    x: -2,
    y: 0,
    z: 0.5,
  };
  const pArr = [
    startPoint,
    {
      x: 2.5,
      y: 0,
      z: startPoint.z,
    },
    {
      x: 3,
      y: 0,
      z: 0,
    },
    {
      x: 3,
      y: 0,
      z: -9.25,
    },
    {
      x: 2.75,
      y: 0,
      z: -9.65,
    },
    {
      x: 2.65,
      y: 0,
      z: -9.75,
    },
    {
      x: 2.25,
      y: 0,
      z: -10,
    },
    {
      x: -7.5,
      y: 0,
      z: -10,
    },
    {
      x: -7.82,
      y: 0,
      z: -9.82,
    },
    {
      x: -8.32,
      y: 0,
      z: -9.32,
    },
    {
      x: -8.5,
      y: 0,
      z: -9,
    },
    {
      x: -8.5,
      y: 0,
      z: -3,
    },
    {
      x: -8.45,
      y: 0,
      z: -2.75,
    },
    {
      x: -8.25,
      y: 0,
      z: -2.15,
    },
    {
      x: -8,
      y: 0,
      z: -2,
    },
    {
      x: -3,
      y: 0,
      z: -2,
    },
    {
      x: -2.5,
      y: 0,
      z: -1.5,
    },
    {
      x: -2.5,
      y: 0,
      z: 0,
    },
    startPoint,
  ];
  const points: number[] = [];
  for (var i = 0; i < pArr.length; i++) {
    var randomX = pArr[i].x;
    var randomY = pArr[i].y;
    var randomZ = pArr[i].z;
    points.push(randomX, randomY, randomZ);
  }
  const line = createLine(points, 1, 0x000000);
  group.add(line);

  const squareShape = new THREE.Shape()
    .moveTo(-1, 0)
    .lineTo(3.5, 0)
    .lineTo(3.5, 9.5)
    .lineTo(-6.5, 9.5)
    .lineTo(-7.25, 8.5)
    .lineTo(-7.25, 3)
    .lineTo(-1, 3)
    .lineTo(-1, 0);

  const mesh = createBasePlane(squareShape, '#ccc', -1, 0, 0, -0.5 * Math.PI, 0, 0);
  mesh.position.y = 0.06;
  group.add(mesh);

  const shape2 = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 0.8)
    .lineTo(0.2, 1)
    .lineTo(2, 1)
    .lineTo(2.2, 0.8)
    .lineTo(2.2, 0)
    .lineTo(0, 0);

  const mesh2 = createBasePlane(shape2, '#111', 0.25, 0, 0.5, 0.5 * Math.PI, 0, 0);
  mesh2.position.y = 0.06;
  group.add(mesh2);
  if (font) {
    const text = createText(font, '#000', `AWS Public Cloud`, SIZE * 0.5, {
      x: -5.5,
      y: 0.1,
      z: -9.25,
    });
    text.rotation.x = -0.5 * Math.PI;
    // text.rotation.z = 0.5 * Math.PI;
    group.add(text);

    const text2 = createText(font, '#d4b106', `VPN\n Gateway`, SIZE * 0.3, {
      x: 1,
      y: 0.1,
      z: -0.24,
    });
    text2.rotation.x = -0.5 * Math.PI;
    group.add(text2);
  }

  const host1 = createHost();
  group.add(host1);

  const host2 = createHost2();
  group.add(host2);

  const host3 = createHost3();
  group.add(host3);

  const branch = createBranch();
  group.add(branch);
  return group;
};

function addShape(
  shape: THREE.Shape,
  extrudeSettings: THREE.ExtrudeGeometryOptions,
  color: THREE.ColorRepresentation,
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
  s: number,
) {
  // extruded shape

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const normal = new THREE.MeshBasicMaterial({ color: color });
  const branchPng = loader.load('./images/branch.png');
  const mesh = new THREE.Mesh(geometry, [
    new THREE.MeshBasicMaterial({ color: color, map: branchPng }),
    normal,
    normal,
    normal,
    normal,
    normal,
  ]);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(s, s, s);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#ccc' }));
  mesh.add(line);
  return mesh;
}

const createBranch = () => {
  const sqLength = 1;
  const extrudeSettings = {
    depth: 1,
    bevelEnabled: true,
    bevelSegments: 0,
    steps: 1,
    bevelSize: 1,
    bevelThickness: 1,
  };
  const squareShape = new THREE.Shape()
    .moveTo(0, 0.2)
    .lineTo(0.2, 0)
    .lineTo(sqLength - 0.2, 0)
    .lineTo(sqLength, 0.2)
    .lineTo(sqLength, sqLength - 0.2)
    .lineTo(sqLength - 0.2, sqLength)
    .lineTo(0.2, sqLength)
    .lineTo(0, sqLength - 0.2)
    .lineTo(0, 0.2);
  return addShape(
    squareShape,
    extrudeSettings,
    '#eee',
    -0.4,
    0.7,
    -5.25,
    0.5 * Math.PI,
    0,
    0,
    0.35,
  );
};

const createHost = () => {
  const group = new THREE.Group();
  const shape = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 0.8)
    .lineTo(0.2, 1)
    .lineTo(2.6, 1)
    .lineTo(2.8, 0.8)
    .lineTo(2.8, 0)
    .lineTo(0, 0);

  const mesh = createBasePlane(shape, '#69b1ff', 0, 0, 0, 0.5 * Math.PI, 0, -0.5 * Math.PI);
  if (font) {
    const text = createText(font, '#fff', `10.0.1.0/24`, SIZE * 0.35, {
      x: 0.22,
      y: 0.55,
      z: -0.01,
    });
    text.rotation.x = -Math.PI;
    mesh.add(text);
  }
  group.add(mesh);
  const shape2 = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 2)
    .lineTo(0.2, 2.2)
    .lineTo(2.6, 2.2)
    .lineTo(2.8, 2)
    .lineTo(2.8, 0)
    .lineTo(0, 0);

  const mesh2 = createBasePlane(shape2, '#fff', 0, 0, 0, -0.5 * Math.PI, 0, 0.5 * Math.PI);
  group.add(mesh2);
  group.position.x = 1;
  group.position.z = -1.2;
  group.position.y = 0.2;

  const node = createBaseNode('#eee', SIZE, 0.5);
  // 加载一个资源
  const texture = loader.load('./images/m4.png');
  (node.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
    color: '#eee',
    map: texture,
  });
  node.position.x = -1.2;
  node.position.z = -1.5;

  group.add(node);
  return group;
};

const createHost2 = () => {
  const group = new THREE.Group();
  const shape = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 0.8)
    .lineTo(0.2, 1)
    .lineTo(2.6, 1)
    .lineTo(2.8, 0.8)
    .lineTo(2.8, 0)
    .lineTo(0, 0);

  const mesh = createBasePlane(shape, '#69b1ff', 0, 0, 0, 0.5 * Math.PI, 0, -0.5 * Math.PI);
  if (font) {
    const text = createText(font, '#fff', `10.0.2.0/24`, SIZE * 0.35, {
      x: 0.25,
      y: 0.55,
      z: -0.01,
    });
    text.rotation.x = -Math.PI;
    mesh.add(text);
  }
  group.add(mesh);
  const shape2 = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 2.6)
    .lineTo(-1, 3.6)
    .lineTo(-3, 3.6)
    .lineTo(-3, 5.6)
    .lineTo(-2.8, 5.8)
    .lineTo(2.6, 5.8)
    .lineTo(2.8, 5.6)
    .lineTo(2.8, 0)
    .lineTo(0, 0);

  const mesh2 = createBasePlane(shape2, '#fff', 0, 0, 0, -0.5 * Math.PI, 0, 0.5 * Math.PI);
  group.add(mesh2);
  group.position.x = 1;
  group.position.z = -6.2;
  group.position.y = 0.2;

  const node = createBaseNode('#eee', SIZE, 0.5);
  // 加载一个资源
  const texture = loader.load('./images/m4.png');
  (node.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
    color: '#eee',
    map: texture,
  });
  node.position.x = -1.2;
  node.position.z = -1.5;
  group.add(node);
  const createComputeGrid = () => {
    const group = new THREE.Group();
    const node = createBaseNode('#eee', SIZE, 0.5);
    // 加载一个资源
    const texture = loader.load('./images/c3.png');
    (node.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
      color: '#eee',
      map: texture,
    });
    node.position.x = 0;
    node.position.z = -1.5;
    group.add(node);

    const node2 = createBaseNode('#eee', SIZE, 0.5);
    (node2.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
      color: '#eee',
      map: texture,
    });
    node2.position.x = 0;
    node2.position.z = -3;
    group.add(node2);

    const node3 = createBaseNode('#eee', SIZE, 0.5);
    (node3.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
      color: '#eee',
      map: texture,
    });
    node3.position.x = 0;
    node3.position.z = -4.5;

    if (font) {
      const text = createText(font, '#333', `Compute\nGrid`, SIZE * 0.25, {
        x: 0.22,
        y: 0.55,
        z: -0.01,
      });
      text.position.x = -0.75;
      text.position.z = -0.5;
      text.position.y = 0.01;
      text.rotation.x = -0.5 * Math.PI;
      group.add(text);
    }
    group.add(node3);
    return group;
  };
  const grid = createComputeGrid();
  grid.position.x = -4.8;
  grid.position.z = 3;
  group.add(grid);
  return group;
};

const createHost3 = () => {
  const group = new THREE.Group();
  const shape = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 0.8)
    .lineTo(0.2, 1)
    .lineTo(2.6, 1)
    .lineTo(2.8, 0.8)
    .lineTo(2.8, 0)
    .lineTo(0, 0);

  const mesh = createBasePlane(shape, '#69b1ff', 0, 0, 0, 0.5 * Math.PI, 0, -0.5 * Math.PI);
  if (font) {
    const text = createText(font, '#fff', `10.0.3.0/24`, SIZE * 0.35, {
      x: 0.22,
      y: 0.55,
      z: -0.01,
    });
    text.rotation.x = -Math.PI;
    mesh.add(text);
  }
  group.add(mesh);
  const shape2 = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, 4.6)
    .lineTo(0.2, 4.8)
    .lineTo(2.6, 4.8)
    .lineTo(2.8, 4.6)
    .lineTo(2.8, 0)
    .lineTo(0, 0);

  const mesh2 = createBasePlane(shape2, '#fff', 0, 0, 0, -0.5 * Math.PI, 0, 0.5 * Math.PI);
  group.add(mesh2);
  group.position.x = -8;
  group.position.z = -4.2;
  group.position.y = 0.2;
  group.rotation.y = -0.5 * Math.PI;

  const node = createBaseNode('#eee', SIZE * 1.3, 1);
  // 加载一个资源
  const texture = loader.load('./images/m4.png');
  (node.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
    color: '#eee',
    map: texture,
  });
  node.position.x = -1.2;
  node.position.z = -1.5;
  group.add(node);
  const node2 = createBaseNode('#eee', SIZE * 1.3, 1);
  (node2.material as THREE.MeshBasicMaterial[])[2] = new THREE.MeshBasicMaterial({
    color: '#eee',
    map: texture,
  });
  node2.position.x = -3.2;
  node2.position.z = -1.5;

  group.add(node2);
  return group;
};

// camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(0, 10, 40);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

const createWorld = () => {
  const ground = createGround();
  const group = createDatabaseGroup();
  const cloud = createCloud();
  ground.add(group);
  ground.add(cloud);
  return ground
}

async function draw() {
  if (process.env.NODE_ENV === 'development') {
    //辅助工具
    const helper = new THREE.AxesHelper(40);
    scene.add(helper);
  }
  await getFont();
  
  const world = createWorld()
  scene.add(world);
  const world2 = createWorld()
  world2.position.x = -14
  scene.add(world2);

  const world3 = createWorld()
  world3.position.z = -18
  scene.add(world3);

  const world4 = createWorld()
  world4.position.x = 14
  world4.position.z = -18
  scene.add(world4);

  const world5 = createWorld()
  world5.position.x = 14
  world5.position.z = -36
  scene.add(world5);

  matLines.forEach((line) => {
    line.resolution.set(window.innerWidth, window.innerHeight);
  });
  animate();
  window.addEventListener('resize', onWindowResize);
}

draw();
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
