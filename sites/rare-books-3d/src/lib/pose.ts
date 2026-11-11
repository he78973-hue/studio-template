/**
 * 抽出查看时，书本应当悬停在相机正前方、正面（书脊）朝向读者。
 * 本模块把「相机 + 书本尺寸」换算成一个世界空间位姿。
 *
 * 之所以每帧重算而不是点击时快照：用户可以在抽出过程中继续拖动 OrbitControls，
 * 书本会实时追随相机，交互不断裂。
 */
import * as THREE from 'three';
import type { Book } from '../types';

const _dir = new THREE.Vector3();
const _m = new THREE.Matrix4();

export interface Pose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export function createPose(): Pose {
  return { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
}

/**
 * 计算「相机正前方」位姿。
 * @param camera   当前相机
 * @param book     目标书（按尺寸缩放距离，大开本不会糊满屏幕）
 * @param out      复用对象，避免每帧分配
 */
export function computeCameraPose(camera: THREE.Camera, book: Book, out: Pose): Pose {
  const dims = book.dimensions;
  // 距离同时受高度和宽度约束：竖长书按高度、宽厚书按宽度
  const dist = Math.max(0.62, dims.height * 2.1, dims.width * 4.2);

  camera.getWorldDirection(_dir);
  out.position.copy(camera.position).addScaledVector(_dir, dist);

  // 让书本局部 +Z（书脊面）朝向相机。
  // Matrix4.lookAt(eye, target, up) 的 +Z = eye - target，
  // 因此 eye 取相机、target 取书本，即可让书脊正对读者。
  _m.lookAt(camera.position, out.position, camera.up);
  out.quaternion.setFromRotationMatrix(_m);
  return out;
}

/** GSAP 进度 → 缓动值（与 ease 'power3.inOut' 近似，用于每帧位姿插值） */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
