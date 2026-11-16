import * as THREE from 'three';
import { clamp, lerp } from './course.js';

export function createSkier() {
  const group = new THREE.Group(), rig = new THREE.Group(); group.add(rig);
  const mat = (color, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
  const orange = mat('#ec663e'), orangeLight = mat('#f67d46'), dark = mat('#283e44'), cream = mat('#eee9d7'), metal = mat('#a9bfc1', .35), lens = mat('#e2b46a', .22), red = mat('#a84032');
  const mesh = (geometry, material, parent = rig) => { const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const body = new THREE.Group(); rig.add(body);
  const torso = mesh(new THREE.CapsuleGeometry(.32, .4, 3, 8), orange, body); torso.scale.set(1.14, 1, .78); torso.position.y = 1.17;
  const shoulder = mesh(new THREE.SphereGeometry(.34, 8, 6), orangeLight, body); shoulder.scale.set(1.14, .58, .85); shoulder.position.set(0, 1.5, -.01);
  const hood = mesh(new THREE.TorusGeometry(.19, .07, 5, 9), red, body); hood.rotation.x = Math.PI / 2; hood.position.set(0, 1.56, .06);
  const helmet = mesh(new THREE.SphereGeometry(.29, 10, 8), cream, body); helmet.scale.set(1, .9, 1.08); helmet.position.set(0, 1.88, -.12);
  const band = mesh(new THREE.BoxGeometry(.55, .11, .4), dark, body); band.position.set(0, 1.88, -.17);
  const goggles = mesh(new THREE.BoxGeometry(.44, .17, .1), lens, body); goggles.position.set(0, 1.88, -.44);
  const pack = mesh(new THREE.BoxGeometry(.43, .46, .18), red, body); pack.position.set(0, 1.24, .27);
  for (const s of [-1, 1]) { const strap = mesh(new THREE.BoxGeometry(.045, .57, .06), cream, body); strap.position.set(s * .16, 1.25, .375); }
  const pelvis = mesh(new THREE.BoxGeometry(.52, .22, .35), dark); pelvis.position.y = .82;
  const segments = [];
  function limb(material, radius) { const m = mesh(new THREE.CylinderGeometry(radius * .88, radius, 1, 7), material); segments.push(m); return m; }
  const legs = [-1, 1].map(s => ({ s, upper: limb(dark, .13), lower: limb(dark, .105) }));
  const arms = [-1, 1].map(s => ({ s, upper: limb(orange, .115), lower: limb(orangeLight, .10), pole: limb(metal, .019), glove: mesh(new THREE.SphereGeometry(.115, 7, 5), dark) }));
  const skis = [];
  for (const s of [-1, 1]) {
    const skiGroup = new THREE.Group(); rig.add(skiGroup); skiGroup.position.x = s * .28;
    const ski = mesh(new THREE.BoxGeometry(.17, .065, 1.93), cream, skiGroup); ski.position.y = .06;
    const top = mesh(new THREE.BoxGeometry(.135, .012, 1.5), dark, skiGroup); top.position.set(0, .1, .05);
    const tip = mesh(new THREE.BoxGeometry(.17, .065, .27), orange, skiGroup); tip.position.set(0, .11, -1.06); tip.rotation.x = -.31;
    const heel = mesh(new THREE.BoxGeometry(.17, .07, .18), orange, skiGroup); heel.position.set(0, .065, .99);
    const boot = mesh(new THREE.BoxGeometry(.23, .26, .42), dark, skiGroup); boot.position.set(0, .22, .01);
    const cuff = mesh(new THREE.BoxGeometry(.25, .065, .23), cream, skiGroup); cuff.position.set(0, .32, .09);
    skis.push(skiGroup);
  }
  const up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), delta = new THREE.Vector3();
  function connect(m, p1, p2) { a.set(...p1); b.set(...p2); delta.subVectors(b, a); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.y = delta.length(); m.quaternion.setFromUnitVectors(up, delta.normalize()); }
  return {
    group,
    animate(steer, jump, time, crashed, crashAge = 0, landing = 0, slope = 0) {
      const fall = clamp(crashAge / .65, 0, 1), crouch = jump > .02 ? .19 : landing * .15 + Math.sin(time * 6) * .014;
      rig.rotation.set(-.01 - slope / 1.2 + (jump > 0 ? -.1 : 0), -steer * .32, -steer * .22);
      rig.position.y = 0;
      if (crashed) { rig.rotation.z = -fall * 1.38; rig.rotation.y = -.5 * fall; rig.rotation.x = -.3 * fall; rig.position.y = .25 * fall; }
      body.position.y = -crouch; body.rotation.x = -.1 - Math.abs(steer) * .07; body.rotation.z = -steer * .06;
      pelvis.position.y = .82 - crouch;
      for (const leg of legs) {
        const s = leg.s, knee = [s * .28, .52 - crouch * .45, -.2 - crouch * .4];
        connect(leg.upper, [s * .2, .88 - crouch, .06], knee);
        connect(leg.lower, knee, [s * .28, .27, .05]);
      }
      for (const arm of arms) {
        const s = arm.s, elbow = [s * (.49 + jump * .025), 1.16 - crouch, -.09];
        const hand = [s * .64, .98 - crouch + jump * .12, -.37 + Math.sin(time * 3 + s) * .035];
        connect(arm.upper, [s * .32, 1.5 - crouch, -.04], elbow);
        connect(arm.lower, elbow, hand); arm.glove.position.set(...hand);
        connect(arm.pole, hand, [s * .86, .12 + jump * .08, .64]);
      }
      skis.forEach((ski, i) => { ski.rotation.y = (i ? -1 : 1) * Math.abs(steer) * .04; ski.rotation.x = jump > 0 ? -.09 : lerp(0, .07, landing); });
    },
  };
}
