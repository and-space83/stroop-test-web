import { useRef, useCallback, useEffect } from 'react';
import type { MousePoint, ClickData, KeystrokeData, MotionSample } from '../types';

interface TrackingSnapshot {
  mousePath: MousePoint[];
  clicks: ClickData[];
  keystrokes: KeystrokeData[];
  motionSamples: MotionSample[];
  mouseJitter: number;
  mousePathLength: number;
  mouseMaxSpeed: number;
}

export function useInputTracking(active: boolean, stimulusShownAt: number) {
  const mousePathRef = useRef<MousePoint[]>([]);
  const clicksRef = useRef<ClickData[]>([]);
  const keystrokesRef = useRef<KeystrokeData[]>([]);
  const motionRef = useRef<MotionSample[]>([]);
  const mouseDownInfoRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const keyDownTimesRef = useRef<Map<string, number>>(new Map());
  const prevPointRef = useRef<MousePoint | null>(null);

  const reset = useCallback(() => {
    mousePathRef.current = [];
    clicksRef.current = [];
    keystrokesRef.current = [];
    motionRef.current = [];
    mouseDownInfoRef.current = null;
    keyDownTimesRef.current.clear();
    prevPointRef.current = null;
  }, []);

  // マウス移動
  useEffect(() => {
    if (!active) return;

    const handleMouseMove = (e: MouseEvent) => {
      const t = performance.now() - stimulusShownAt;
      const prev = prevPointRef.current;
      let vx = 0, vy = 0;

      if (prev) {
        const dt = t - prev.t;
        if (dt > 0) {
          vx = (e.clientX - prev.x) / dt;
          vy = (e.clientY - prev.y) / dt;
        }
      }

      const point: MousePoint = { x: e.clientX, y: e.clientY, t, vx, vy };
      mousePathRef.current.push(point);
      prevPointRef.current = point;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [active, stimulusShownAt]);

  // マウスクリック
  useEffect(() => {
    if (!active) return;

    const handleMouseDown = (e: MouseEvent) => {
      mouseDownInfoRef.current = {
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
      };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!mouseDownInfoRef.current) return;
      const downInfo = mouseDownInfoRef.current;
      const pressDuration = performance.now() - downInfo.t;

      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const targetCenterX = rect.left + rect.width / 2;
      const targetCenterY = rect.top + rect.height / 2;
      const distanceFromCenter = Math.hypot(e.clientX - targetCenterX, e.clientY - targetCenterY);

      clicksRef.current.push({
        x: e.clientX,
        y: e.clientY,
        targetX: targetCenterX,
        targetY: targetCenterY,
        targetWidth: rect.width,
        targetHeight: rect.height,
        distanceFromCenter,
        pressDuration,
        t: performance.now() - stimulusShownAt,
      });
      mouseDownInfoRef.current = null;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [active, stimulusShownAt]);

  // キーストローク
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyDownTimesRef.current.has(e.key)) {
        keyDownTimesRef.current.set(e.key, performance.now());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const downTime = keyDownTimesRef.current.get(e.key);
      if (downTime !== undefined) {
        keystrokesRef.current.push({
          key: e.key,
          dwellTime: performance.now() - downTime,
          t: performance.now() - stimulusShownAt,
        });
        keyDownTimesRef.current.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active, stimulusShownAt]);

  // デバイスモーション（モバイル）
  useEffect(() => {
    if (!active) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      motionRef.current.push({
        ax: acc.x ?? 0,
        ay: acc.y ?? 0,
        az: acc.z ?? 0,
        t: performance.now() - stimulusShownAt,
      });
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [active, stimulusShownAt]);

  // スナップショット取得（試行完了時に呼ぶ）
  const getSnapshot = useCallback((): TrackingSnapshot => {
    const path = mousePathRef.current;

    // 移動距離合計
    let pathLength = 0;
    let maxSpeed = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      pathLength += Math.hypot(dx, dy);
      const speed = Math.hypot(path[i].vx ?? 0, path[i].vy ?? 0);
      if (speed > maxSpeed) maxSpeed = speed;
    }

    // ジッター：連続3点での方向変化量の平均
    let jitterSum = 0;
    let jitterCount = 0;
    for (let i = 1; i < path.length - 1; i++) {
      const v1x = path[i].x - path[i - 1].x;
      const v1y = path[i].y - path[i - 1].y;
      const v2x = path[i + 1].x - path[i].x;
      const v2y = path[i + 1].y - path[i].y;
      const cross = Math.abs(v1x * v2y - v1y * v2x);
      jitterSum += cross;
      jitterCount++;
    }
    const mouseJitter = jitterCount > 0 ? jitterSum / jitterCount : 0;

    return {
      mousePath: [...path],
      clicks: [...clicksRef.current],
      keystrokes: [...keystrokesRef.current],
      motionSamples: [...motionRef.current],
      mouseJitter,
      mousePathLength: pathLength,
      mouseMaxSpeed: maxSpeed,
    };
  }, []);

  return { reset, getSnapshot };
}
