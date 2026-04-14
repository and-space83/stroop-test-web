// 被験者情報
export interface Participant {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  handedness: 'right' | 'left';
  note: string;
  createdAt: number;
}

// テストモード
export type TestMode = 'color-naming' | 'incongruent' | 'both';

// 試行タイプ
//  - color-naming: 色のついた丸を出題して色名を答える
//  - word: 色名の単語を色付きで表示し、そのインク色を答える（従来のストループ）
export type TrialType = 'color-naming' | 'word';

// 刺激（1試行分の問題）
export interface Stimulus {
  type: TrialType;
  word: string;       // 表示する色名（type=color-naming では未使用で空文字）
  wordColor: string;  // 実際のインク色 / 丸の色
  correctAnswer: string; // 正解（色名）
  isCongruent: boolean;  // 一致条件かどうか（type=color-naming では常に true 扱い）
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
  mode: TestMode;
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
  { name: 'あか', value: '#e63946' },
  { name: 'あお', value: '#1d7fc4' },
  { name: 'みどり', value: '#2a9d5c' },
  { name: 'きいろ', value: '#f4a211' },
];
