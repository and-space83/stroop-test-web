// 被験者情報
export interface Participant {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  handedness: 'right' | 'left';
  note: string;
  createdAt: number;
}

// 刺激（1試行分の問題）
export interface Stimulus {
  word: string;       // 表示する色名
  wordColor: string;  // 実際のインク色
  correctAnswer: string; // 正解（インク色）
  isCongruent: boolean;  // 一致条件かどうか
}

// マウスイベントの1点
export interface MousePoint {
  x: number;
  y: number;
  t: number; // performance.now() からの相対時刻(ms)
  vx?: number;
  vy?: number;
}

// クリックデータ
export interface ClickData {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  distanceFromCenter: number;
  pressDuration: number; // mousedown〜mouseup (ms)
  t: number;
}

// キーストロークデータ
export interface KeystrokeData {
  key: string;
  dwellTime: number;  // 押下時間 (ms)
  t: number;          // 押下タイミング (ms)
}

// デバイスモーション（モバイル用）
export interface MotionSample {
  ax: number; // acceleration x
  ay: number;
  az: number;
  t: number;
}

// 1試行分の完全な計測データ
export interface TrialData {
  trialIndex: number;
  stimulus: Stimulus;
  response: string;        // ユーザーの回答（色名）
  isCorrect: boolean;
  reactionTime: number;    // 刺激表示〜回答 (ms)

  // 入力計測
  mousePath: MousePoint[];
  clicks: ClickData[];
  keystrokes: KeystrokeData[];
  motionSamples: MotionSample[];

  // マウス集計（ML用特徴量として）
  mouseJitter: number;       // 微細振動量
  mousePathLength: number;   // 総移動距離
  mouseMaxSpeed: number;     // 最高速度

  stimulusShownAt: number;   // performance.now()
}

// セッション全体のデータ
export interface SessionData {
  participant: Participant;
  trials: TrialData[];
  startedAt: number;
  finishedAt: number;
  totalTrials: number;
  correctCount: number;
  averageRT: number;
  congruentAvgRT: number;
  incongruentAvgRT: number;
}

// 画面状態
export type AppScreen = 'form' | 'task' | 'results';

// カラー定数
export const COLORS: { name: string; value: string }[] = [
  { name: '赤', value: '#e63946' },
  { name: '青', value: '#1d7fc4' },
  { name: '緑', value: '#2a9d5c' },
  { name: '黄', value: '#f4a211' },
];
