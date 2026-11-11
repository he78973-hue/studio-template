/**
 * AstronomyBookManager —— 统一 GSAP 时间线的总编排
 * ─────────────────────────────────────────────────────────────
 * 一条 timeline 串起原本分散的三段动画，用 label + 位置参数实现「无缝交织」：
 *
 *   阶段一  0.00s → 1.00s   fly           书本飞至镜头前；Morph Targets 翻开
 *                                          （fold 1→0），完全摊开后纸面外卷（curl 0→0.42）
 *   阶段二  0.80s → 1.50s   nebula        与翻书后半段重叠 0.2s：
 *                                          星轨粒子从书页中心按各自 delay 分层喷涌
 *   阶段三  1.20s → 2.00s   constellation 浮雕插画从纸面升起（与星轨再重叠 0.6s），
 *                                          就位后开启阻尼视差
 *
 *   ● 三段之间是 overlap 而非首尾相接，视觉上成为一次连续「绽放」。
 *   ● 所有补间都写代理对象（morph / bloom / rise / opacity），由各子组件在
 *     useFrame 里读取并落到 three 对象上——React 完全不参与逐帧渲染。
 *   ● 退场是一条独立的 exit timeline：插画下落 → 星轨收回 → 合书 → 飞回待位，
 *     onComplete 里 resources.releaseAll() 彻底擦除显存，再 reportClosed()
 *     把状态机交回 provider（若有排队书目则无缝换本）。
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { applyMorph } from './geometry';
import { ensureBookResources } from './bookResources';
import { ConstellationLayer, type ConstellationLayerHandle } from './ConstellationLayer';
import { PageHtmlOverlay } from './PageHtmlOverlay';
import { StarOrbitNebula, type StarOrbitNebulaHandle } from './StarOrbitNebula';
import { useAstronomyBook } from './AstronomyBookContext';
import { computeCameraPose, createPose } from '../lib/pose';

/** 待命位姿：画面下方、略微仰角（关闭后书本回到这里） */
const REST_POSE = {
  position: [0, -0.62, 1.3] as [number, number, number],
  rotation: [-0.62, 0, 0] as [number, number, number],
};

/** 时间轴刻度（秒），与 README / HUD 标尺保持一致 */
export const TIMELINE = {
  fly: 0,
  nebula: 0.8,
  constellation: 1.2,
  total: 2.0,
};

export function AstronomyBookManager() {
  const { activeBookId, books, pointer, progressRef, resources, reducedMotion, registerManager, reportOpen, reportClosed } =
    useAstronomyBook();
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | { target: THREE.Vector3; update(): void }
    | null;

  const book = useMemo(() => books.find((b) => b.id === activeBookId) ?? null, [books, activeBookId]);

  const rootRef = useRef<THREE.Group>(null);
  const pageRef = useRef<THREE.Mesh>(null);
  const nebulaRef = useRef<StarOrbitNebulaHandle | null>(null);
  const constelRef = useRef<ConstellationLayerHandle | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  /** GSAP 补间的四个代理宿主（子组件在 useFrame 读取） */
  const morph = useRef({ fold: 1, curl: 0 });
  const bloom = useRef({ value: 0 });
  const rise = useRef({ value: 0 });
  const nebulaOpacity = useRef({ value: 0 });

  const applyMorphNow = useCallback(() => {
    applyMorph(pageRef.current, morph.current.fold, morph.current.curl);
  }, []);

  /** 资源（幂等创建 / 复用；换书时由 cache 淘汰上一本） */
  const res = useMemo(
    () => (book ? ensureBookResources(book, resources) : null),
    [book, resources]
  );

  /* ── 打开：构建统一时间线 ─────────────────────────────────── */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!book || !res || !root) return;

    resources.touch(book.id); // 触活 + 淘汰其他书（显存）

    // 初始状态：待位姿 + 合上书 + 全部收起
    root.visible = true;
    gsap.set(root.position, { x: REST_POSE.position[0], y: REST_POSE.position[1], z: REST_POSE.position[2] });
    gsap.set(root.rotation, { x: REST_POSE.rotation[0], y: REST_POSE.rotation[1], z: REST_POSE.rotation[2] });
    morph.current = { fold: 1, curl: 0 };
    bloom.current.value = 0;
    rise.current.value = 0;
    nebulaOpacity.current.value = 0;
    applyMorphNow();
    nebulaRef.current?.setVisible(false);
    constelRef.current?.setVisible(false);
    constelRef.current?.setParallax(false);

    // 目标位姿：相机正前方、书页朝向读者（按书的尺寸收敛距离）
    const pose = computeCameraPose(camera, book, createPose());
    const euler = new THREE.Euler().setFromQuaternion(pose.quaternion);
    const d = reducedMotion ? 0.001 : 1;

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onUpdate: () => {
        progressRef.current = tl.progress();
      },
      onComplete: () => {
        // 展开就位后，把轨道控制器目标平滑移到书本中心：
        // 之后拖拽/缩放都是「绕着星图」进行，实现全角度沉浸观察
        const root = rootRef.current;
        if (controls && root) {
          gsap.to(controls.target, {
            x: root.position.x,
            y: root.position.y,
            z: root.position.z,
            duration: reducedMotion ? 0.001 : 0.6,
            ease: 'power2.inOut',
            onUpdate: () => controls.update(),
          });
        }
        reportOpen();
      },
    });

    // ── 阶段一 0.00 → 1.00：飞行 + 翻开 ──
    tl.addLabel('fly', TIMELINE.fly)
      .to(
        root.position,
        { x: pose.position.x, y: pose.position.y, z: pose.position.z, duration: d, ease: 'power2.inOut' },
        'fly'
      )
      .to(root.rotation, { x: euler.x, y: euler.y, z: euler.z, duration: d, ease: 'power2.inOut' }, 'fly')
      .to(morph.current, { fold: 0, duration: d, ease: 'power2.inOut', onUpdate: applyMorphNow }, 'fly')
      // 完全摊开后：纸面自然外卷（阅读垂坠感）
      .to(morph.current, { curl: 0.42, duration: 0.45 * d, ease: 'sine.out', onUpdate: applyMorphNow }, 'fly+=1');

    // ── 阶段二 0.80 → 1.50：与翻书重叠 0.2s，星轨从书页缝隙喷涌 ──
    tl.addLabel('nebula', TIMELINE.nebula)
      .call(() => nebulaRef.current?.setVisible(true), undefined, 'nebula')
      .to(
        bloom.current,
        {
          value: 1,
          duration: 0.7 * d,
          ease: 'power2.out',
          onUpdate: () => nebulaRef.current?.setBloom(bloom.current.value),
        },
        'nebula'
      )
      .to(
        nebulaOpacity.current,
        {
          // 0.75 而非 1：留出透气感，避免星轨糊成一片
          value: 0.75,
          duration: 0.5 * d,
          ease: 'power2.out',
          onUpdate: () => nebulaRef.current?.setOpacity(nebulaOpacity.current.value),
        },
        'nebula'
      );

    // ── 阶段三 1.20 → 2.00：浮雕插画升起 + 阻尼视差 ──
    tl.addLabel('constellation', TIMELINE.constellation)
      .call(() => constelRef.current?.setVisible(true), undefined, 'constellation')
      .to(
        rise.current,
        {
          value: 1,
          duration: 0.8 * d,
          ease: 'power3.out',
          onUpdate: () => constelRef.current?.setRise(rise.current.value),
        },
        'constellation'
      )
      .call(() => constelRef.current?.setParallax(true), undefined, 'constellation+=0.45');

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [book, res, camera, resources, reducedMotion, applyMorphNow, reportOpen, progressRef]);

  /* ── 退场：插画下落 → 星轨收回 → 合书 → 飞回待位 → 擦除显存 ── */
  const playClose = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    tlRef.current?.kill();
    const d = reducedMotion ? 0.001 : 1;

    const exit = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        // 先隐藏，再释放：避免「资源已 dispose 但组件尚未卸载」的那一帧
        root.visible = false;
        // 彻底擦除：这本书的粒子缓冲 / 羊皮纸纹理 / 浮雕纹理 / Morph 几何全部 dispose
        resources.releaseAll();
        reportClosed();
      },
    });

    exit
      .to(rise.current, {
        value: 0,
        duration: 0.3 * d,
        onUpdate: () => constelRef.current?.setRise(rise.current.value),
      }, 0)
      .to(
        bloom.current,
        {
          value: 0,
          duration: 0.4 * d,
          onUpdate: () => nebulaRef.current?.setBloom(bloom.current.value),
          onComplete: () => nebulaRef.current?.setVisible(false),
        },
        0.05
      )
      .to(
        nebulaOpacity.current,
        { value: 0, duration: 0.3 * d, onUpdate: () => nebulaRef.current?.setOpacity(nebulaOpacity.current.value) },
        0.05
      )
      .to(morph.current, { fold: 1, curl: 0, duration: 0.5 * d, onUpdate: applyMorphNow }, 0.14)
      .to(
        root.rotation,
        { x: REST_POSE.rotation[0], y: REST_POSE.rotation[1], z: REST_POSE.rotation[2], duration: 0.55 * d },
        0.22
      )
      .to(
        root.position,
        { x: REST_POSE.position[0], y: REST_POSE.position[1], z: REST_POSE.position[2], duration: 0.55 * d },
        0.22
      );

    tlRef.current = exit;
  }, [reducedMotion, resources, reportClosed, applyMorphNow]);

  /* ── 预热：悬停某本书时提前建好资源，打开瞬间零重建 ── */
  const prefetch = useCallback(
    (bookId: string) => {
      const target = books.find((b) => b.id === bookId);
      if (!target) return;
      // retain：预热但受预算约束（活动书本 + maxWarm 本），
      // 鼠标快速扫过 60 条书目也不会无界建栈
      ensureBookResources(target, resources);
      resources.retain(bookId);
    },
    [books, resources]
  );

  /* ── 向 provider 注册句柄（子 → 父唯一通道） ── */
  useLayoutEffect(() => {
    registerManager({ playClose, prefetch });
    return () => registerManager(null);
  }, [registerManager, playClose, prefetch]);

  /* ── 卸载兜底：杀掉时间线 + 擦除全部显存 ── */
  useEffect(
    () => () => {
      tlRef.current?.kill();
      tlRef.current = null;
      resources.releaseAll();
    },
    [resources]
  );

  const onNebulaHandle = useCallback((h: StarOrbitNebulaHandle) => {
    nebulaRef.current = h;
  }, []);
  const onConstelHandle = useCallback((h: ConstellationLayerHandle) => {
    constelRef.current = h;
  }, []);

  return (
    <group ref={rootRef}>
      {book && res && (
        <group key={book.id}>
          {/* 书页：Morph Targets 翻开 */}
          <mesh ref={pageRef} geometry={res.pageGeometry} material={res.pageMaterial} />

          {/* 星轨粒子：从书页中心 [0,0,0] 分层绽放（稍离纸面，避免与纸面共面） */}
          {res.nebulaGeometry && (
            <group position={[0, 0, 0.012]}>
              <StarOrbitNebula
                bookId={book.id}
                geometry={res.nebulaGeometry}
                material={res.nebulaMaterial}
                bloomRef={bloom}
                opacityRef={nebulaOpacity}
                onHandle={onNebulaHandle}
              />
            </group>
          )}

          {/* 复古星座浮雕插画：Multiply 混色叠在纸面上 */}
          <ConstellationLayer
            spread={res.spread}
            geometry={res.constellationGeometry}
            material={res.constellationMaterial}
            riseRef={rise}
            pointer={pointer}
            onHandle={onConstelHandle}
          />

          {/* 2D 文本精准锚定左右页表面 */}
          <PageHtmlOverlay book={book} side="left" pageW={res.spread.pageW} thickness={res.spread.thickness} pageMeshRef={pageRef} />
          <PageHtmlOverlay book={book} side="right" pageW={res.spread.pageW} thickness={res.spread.thickness} pageMeshRef={pageRef} />
        </group>
      )}
    </group>
  );
}
