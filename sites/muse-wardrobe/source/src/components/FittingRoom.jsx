import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { assetPath } from "../lib/runtime.js";

export default function FittingRoom({
  image,
  transparent = true,
  zoom = false,
  flatlay = false,
  resetKey = 0,
}) {
  const host = useRef(null),
    runtime = useRef(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const mount = host.current;
    let frame = 0,
      disposed = false,
      cameraTween = false,
      needsRender = true;
    let last = performance.now();
    function invalidate() {
      needsRender = true;
      if (!frame && !disposed) frame = requestAnimationFrame(draw);
    }
    const params = new URLSearchParams(location.search);
    const gray = params.has("gray");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(gray ? "#ddd9d4" : "#e9e0d5");
    const camera = new THREE.PerspectiveCamera(37, 1, 0.05, 80);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setError("此浏览器暂不支持三维场景，请开启硬件加速或更换浏览器。");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Architecture and lights are static; regenerate shadows only when necessary.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "可拖动视角的三维试衣室");
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = false;
    controls.minAzimuthAngle = -0.19;
    controls.maxAzimuthAngle = 0.19;
    controls.minPolarAngle = 1.35;
    controls.maxPolarAngle = 1.64;
    controls.minDistance = 2.5;
    controls.maxDistance = 4.3;
    controls.rotateSpeed = 0.38;
    controls.zoomSpeed = 0.55;
    controls.enableZoom = true;
    controls.target.set(0, 1.04, 0);
    camera.position.set(0.18, 1.31, 3.9);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    controls.enableDamping = !reduced.matches;
    const material = new THREE.MeshStandardMaterial({
      color: gray ? "#bababa" : "#d5c7b8",
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const meshes = [];
    function box(name, size, position, mat = material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
      return mesh;
    }
    box("floor", [12, 0.12, 12], [0, -0.07, 0]);
    box("back-wall", [12, 4, 0.16], [0, 2, -3.1]);
    box("left-wall", [0.16, 4, 9], [-5, 2, 0]);
    box("right-wall", [0.16, 4, 9], [5, 2, 0]);
    box("window-left", [0.055, 3.3, 0.08], [-3.8, 1.75, -2.92]);
    box("window-middle", [0.055, 3.3, 0.08], [-2.2, 1.75, -2.92]);
    box("window-right", [0.055, 3.3, 0.08], [-0.6, 1.75, -2.92]);
    box("window-sill", [3.25, 0.05, 0.15], [-2.2, 0.13, -2.9]);
    box("rack-base", [1.3, 0.08, 0.5], [2.18, 0.04, -1.1]);
    box("rack-left", [0.045, 1.9, 0.045], [1.6, 1, -1.1]);
    box("rack-right", [0.045, 1.9, 0.045], [2.76, 1, -1.1]);
    box("rack-top", [1.2, 0.045, 0.045], [2.18, 1.94, -1.1]);
    box("bench", [1.5, 0.3, 0.6], [-2.8, 0.24, -0.7]);
    if (!gray) {
      const loader = new THREE.TextureLoader();
      const environment = new THREE.PMREMGenerator(renderer);
      const roomEnvironment = new RoomEnvironment();
      const envTarget = environment.fromScene(roomEnvironment, 0.04);
      scene.environment = envTarget.texture;
      scene.environmentIntensity = 0.35;
      environment.dispose();
      roomEnvironment.dispose();
      const floorMap = loader.load(
        assetPath("images/wood-floor-soft.jpg"),
        invalidate,
      );
      floorMap.colorSpace = THREE.SRGBColorSpace;
      floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
      floorMap.repeat.set(5, 5);
      floorMap.anisotropy = 8;
      const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorMap,
        color: "#d8cbbb",
        roughness: 0.74,
        side: THREE.DoubleSide,
      });
      scene.getObjectByName("floor").material = floorMaterial;
      const plaster = new THREE.MeshStandardMaterial({
        color: "#e4d3c2",
        roughness: 0.95,
        side: THREE.DoubleSide,
      });
      ["back-wall", "left-wall", "right-wall"].forEach((n) => {
        scene.getObjectByName(n).material = plaster;
      });
      const brass = new THREE.MeshStandardMaterial({
        color: "#9c8061",
        metalness: 0.72,
        roughness: 0.28,
        side: THREE.DoubleSide,
      });
      const bronze = new THREE.MeshStandardMaterial({
        color: "#766657",
        metalness: 0.42,
        roughness: 0.45,
        side: THREE.DoubleSide,
      });
      ["window-left", "window-middle", "window-right", "window-sill"].forEach(
        (n) => {
          scene.getObjectByName(n).material = bronze;
        },
      );
      const city = loader.load(assetPath("images/city-window.jpg"), invalidate);
      city.colorSpace = THREE.SRGBColorSpace;
      const view = new THREE.Mesh(
        new THREE.PlaneGeometry(3.18, 3.2),
        new THREE.MeshBasicMaterial({
          map: city,
          color: "#fff5e8",
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      view.position.set(-2.2, 1.76, -2.99);
      scene.add(view);
      box("window-top", [3.3, 0.06, 0.13], [-2.2, 3.36, -2.87], bronze);
      box("window-crossbar", [3.3, 0.045, 0.13], [-2.2, 1.32, -2.86], bronze);
      box(
        "back-baseboard",
        [12, 0.13, 0.07],
        [0, 0.07, -2.99],
        new THREE.MeshStandardMaterial({
          color: "#d4bc9f",
          roughness: 0.8,
          side: THREE.DoubleSide,
        }),
      );
      for (const x of [-3.88, -0.51]) {
        const cloth = new THREE.PlaneGeometry(0.52, 3.4, 36, 1);
        const positions = cloth.attributes.position;
        for (let i = 0; i < positions.count; i++)
          positions.setZ(i, Math.sin(positions.getX(i) * 60) * 0.05);
        cloth.computeVertexNormals();
        const curtain = new THREE.Mesh(
          cloth,
          new THREE.MeshStandardMaterial({
            color: "#eee1d3",
            roughness: 1,
            side: THREE.DoubleSide,
          }),
        );
        curtain.position.set(x, 1.74, -2.73);
        curtain.castShadow = true;
        curtain.receiveShadow = true;
        scene.add(curtain);
      }
      ["rack-base", "rack-left", "rack-right", "rack-top"].forEach((n) => {
        const mesh = scene.getObjectByName(n);
        mesh.position.x -= 0.72;
        mesh.material = brass;
      });
      scene.getObjectByName("rack-base").visible = false;
      for (const x of [0.87, 2.03])
        box("rack-foot", [0.05, 0.045, 0.65], [x, 0.04, -1.1], brass);
      const clothColors = ["#ccb49b", "#e7c0bd", "#f0e6d8", "#a17a64"];
      clothColors.forEach((color, i) => {
        const x = 0.98 + i * 0.26;
        const points = [
          new THREE.Vector3(x - 0.21, 1.7, -1.08),
          new THREE.Vector3(x, 1.86, -1.08),
          new THREE.Vector3(x + 0.21, 1.7, -1.08),
          new THREE.Vector3(x - 0.21, 1.7, -1.08),
        ];
        const hanger = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.02),
            16,
            0.007,
            5,
            false,
          ),
          brass,
        );
        scene.add(hanger);
        const shape = new THREE.Shape();
        shape.moveTo(-0.065, 0.38);
        shape.lineTo(-0.17, 0.32);
        shape.lineTo(-0.26, 0.02);
        shape.lineTo(-0.18, -0.03);
        shape.lineTo(-0.14, 0.12);
        shape.lineTo(-0.145, -0.36);
        shape.quadraticCurveTo(0, -0.4, 0.145, -0.36);
        shape.lineTo(0.14, 0.12);
        shape.lineTo(0.18, -0.03);
        shape.lineTo(0.26, 0.02);
        shape.lineTo(0.17, 0.32);
        shape.lineTo(0.065, 0.38);
        shape.quadraticCurveTo(0, 0.26, -0.065, 0.38);
        const garment = new THREE.Mesh(
          new THREE.ExtrudeGeometry(shape, {
            depth: 0.025,
            bevelEnabled: true,
            bevelSize: 0.012,
            bevelThickness: 0.012,
            bevelSegments: 2,
            steps: 1,
          }),
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.92,
            side: THREE.DoubleSide,
          }),
        );
        garment.position.set(x, 1.31, -1.04 - i * 0.035);
        garment.rotation.y = 0.26;
        garment.castShadow = true;
        garment.receiveShadow = true;
        scene.add(garment);
      });
      const bench = scene.getObjectByName("bench");
      bench.visible = false;
      const seat = new THREE.Mesh(
        new RoundedBoxGeometry(1.05, 0.23, 0.5, 4, 0.09),
        new THREE.MeshStandardMaterial({ color: "#bf907d", roughness: 0.85 }),
      );
      seat.position.set(-1.65, 0.38, -1.16);
      seat.castShadow = true;
      seat.receiveShadow = true;
      scene.add(seat);
      for (const x of [-2.03, -1.27])
        for (const z of [-1.31, -1.01])
          box("bench-leg", [0.035, 0.26, 0.035], [x, 0.14, z], brass);
      const lampStand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 1.6, 12),
        brass,
      );
      lampStand.position.set(-1.36, 0.8, -2.3);
      scene.add(lampStand);
      const lampFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.035, 32),
        brass,
      );
      lampFoot.position.set(-1.36, 0.025, -2.3);
      scene.add(lampFoot);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.26, 0.36, 32, 1, true),
        new THREE.MeshStandardMaterial({
          color: "#f4e2c9",
          emissive: "#d1b08c",
          emissiveIntensity: 0.1,
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      );
      shade.position.set(-1.36, 1.6, -2.3);
      scene.add(shade);
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 768;
      labelCanvas.height = 256;
      const ctx = labelCanvas.getContext("2d");
      ctx.fillStyle = "#9a7965";
      ctx.font = "italic 170px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("muse.", 384, 178);
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 0.45),
        new THREE.MeshBasicMaterial({
          map: labelTexture,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      label.position.set(0.93, 2.45, -2.98);
      scene.add(label);
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const shadowCtx = shadowCanvas.getContext("2d");
      const gradient = shadowCtx.createRadialGradient(
        128,
        128,
        10,
        128,
        128,
        126,
      );
      gradient.addColorStop(0, "rgba(50,30,15,.38)");
      gradient.addColorStop(1, "rgba(50,30,15,0)");
      shadowCtx.fillStyle = gradient;
      shadowCtx.fillRect(0, 0, 256, 256);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.58, 0.28),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(shadowCanvas),
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.name = "person-contact-shadow";
      shadow.position.set(0, 0.004, 0.015);
      scene.add(shadow);
      scene.userData.environmentTarget = envTarget;
    }
    const human = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 1.28, 8, 16),
      new THREE.MeshStandardMaterial({ color: "#aaa6a1" }),
    );
    human.position.set(0, 0.84, 0);
    human.castShadow = true;
    human.visible = gray;
    scene.add(human);
    const ambient = new THREE.HemisphereLight("#fff7ea", "#a69281", 2);
    scene.add(ambient);
    const key = new THREE.DirectionalLight("#fff8ed", 3);
    key.position.set(-3.8, 5, 2.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#fff3eb", 0.6);
    fill.position.set(3, 3, 2);
    scene.add(fill);
    const actors = new THREE.Group();
    scene.add(actors);
    const initialTarget = new THREE.Vector3(0, 1.04, 0);
    const initialPosition = new THREE.Vector3(0.18, 1.31, 3.9);
    const targetPosition = initialPosition.clone(),
      targetLook = initialTarget.clone();
    controls.addEventListener("start", () => {
      cameraTween = false;
      invalidate();
    });
    controls.addEventListener("change", () => {
      mount.dataset.camera = camera.position
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      invalidate();
    });
    const onMotionChange = () => {
      controls.enableDamping = !reduced.matches;
      if (reduced.matches && cameraTween) {
        camera.position.copy(targetPosition);
        controls.target.copy(targetLook);
        cameraTween = false;
      }
      invalidate();
    };
    reduced.addEventListener("change", onMotionChange);
    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const { width, height } = rect;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const stage = mount.parentElement
        .querySelector(".stage-column")
        ?.getBoundingClientRect();
      const xOffset = stage
        ? rect.left + width / 2 - (stage.left + stage.width / 2)
        : 0;
      camera.setViewOffset(
        width,
        height,
        xOffset,
        height * 0.135,
        width,
        height,
      );
      camera.updateProjectionMatrix();
      invalidate();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const onContextLost = (e) => {
      e.preventDefault();
      setError("三维场景暂时不可用，请刷新页面重试。");
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const api = {
      scene,
      camera,
      renderer,
      controls,
      actors,
      invalidate,
      gray,
      human,
      materials: [material],
      meshes,
      setZoom(value) {
        targetPosition.set(
          value ? 0 : 0.18,
          value ? 1.47 : 1.31,
          value ? 2.65 : 3.9,
        );
        targetLook.set(0, value ? 1.2 : 1.04, 0);
        cameraTween = true;
        if (reduced.matches) {
          camera.position.copy(targetPosition);
          controls.target.copy(targetLook);
          cameraTween = false;
        }
        invalidate();
      },
      setInspect(view) {
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = 0.2;
        controls.maxPolarAngle = 2.8;
        const views = {
          front: [0, 1.31, 3.9],
          back: [0, 1.4, -2.5],
          left: [-3.4, 1.5, 0],
          right: [3.4, 1.5, 0],
          top: [2, 4, 3],
          diagonal: [2, 1.8, 3],
        };
        camera.position.set(...(views[view] || views.front));
        controls.target.set(0, 1, 0);
        controls.update();
      },
    };
    runtime.current = api;
    if (params.has("view")) api.setInspect(params.get("view"));
    function draw(now) {
      frame = 0;
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const moving = cameraTween;
      if (cameraTween) {
        camera.position.lerp(targetPosition, 1 - Math.exp(-14 * dt));
        controls.target.lerp(targetLook, 1 - Math.exp(-14 * dt));
        if (camera.position.distanceTo(targetPosition) < 0.001)
          cameraTween = false;
      }
      const cameraChanged = controls.update();
      [...actors.children].forEach((child) => {
        child.rotation.y = Math.atan2(camera.position.x, camera.position.z);
      });
      if (needsRender || moving || cameraChanged) {
        renderer.render(scene, camera);
        needsRender = false;
        mount.dataset.renderCount = String(
          Number(mount.dataset.renderCount || 0) + 1,
        );
      }
      if ((cameraTween || moving || cameraChanged) && !frame)
        frame = requestAnimationFrame(draw);
    }
    const onVisible = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", onVisible);
    invalidate();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      reduced.removeEventListener("change", onMotionChange);
      controls.dispose();
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m) {
            m.map?.dispose();
            m.dispose();
          }
        });
      });
      scene.userData.environmentTarget?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("view"))
      runtime.current?.setZoom(zoom);
  }, [zoom, resetKey]);
  useEffect(() => {
    const api = runtime.current;
    if (!api || api.gray) return;
    let cancelled = false;
    new THREE.TextureLoader().load(
      image,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          8,
          api.renderer.capabilities.getMaxAnisotropy(),
        );
        const aspect = texture.image.width / texture.image.height;
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 1,
          alphaTest: 0.015,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
        const figure = new THREE.Mesh(
          new THREE.PlaneGeometry(1.58 * aspect, 1.58),
          material,
        );
        figure.position.set(0, 0.785, 0.015);
        const contactShadow = api.scene.getObjectByName(
          "person-contact-shadow",
        );
        if (contactShadow && transparent) {
          const sample = document.createElement("canvas");
          sample.width = 96;
          sample.height = 240;
          const ctx = sample.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(texture.image, 0, 0, 96, 240);
          const pixels = ctx.getImageData(0, 222, 96, 18).data;
          let weight = 0,
            sum = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 128) {
              weight++;
              sum += (i / 4) % 96;
            }
          }
          contactShadow.position.x = weight
            ? (sum / weight / 96 - 0.5) * 1.58 * aspect
            : 0;
        }
        figure.renderOrder = 3;
        // Compare outfits without double silhouettes: retain the old image while
        // loading, then replace both actor and texture atomically in one frame.
        [...api.actors.children].forEach((o) => {
          api.actors.remove(o);
          o.geometry.dispose();
          o.material.map?.dispose();
          o.material.dispose();
        });
        api.actors.add(figure);
        api.human.visible = false;
        api.renderer.shadowMap.needsUpdate = true;
        api.invalidate();
        setError("");
        host.current.dataset.image = image.startsWith("data:")
          ? "uploaded-photo"
          : image;
        host.current.dataset.actors = String(api.actors.children.length);
      },
      undefined,
      () => {
        if (!cancelled) setError("人物图片未能加载，请重新选择衣服。");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [image, transparent]);
  useEffect(() => {
    if (runtime.current) {
      runtime.current.actors.visible = !flatlay;
      runtime.current.invalidate();
    }
  }, [flatlay]);
  return (
    <div
      ref={host}
      className={`fitting-room ${flatlay ? "room-flatlay" : ""}`}
      data-renderer="threejs"
    >
      {error && (
        <p className="webgl-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
