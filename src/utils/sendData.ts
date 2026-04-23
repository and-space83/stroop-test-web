import { supabase } from '../lib/supabase';
import type { TrialData } from '../types';
import type { Database } from '../types/database.types';

type TableName = keyof Database['public']['Tables'];

const BUFFER_KEY = 'stroop_pending_sends';

type PendingItem =
  | { op: 'insert'; table: TableName; data: unknown; createdAt: number }
  | { op: 'update'; table: TableName; data: unknown; match: Record<string, unknown>; createdAt: number };

export interface DeviceInfo {
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  devicePixelRatio: number;
  platform: string;
  touchSupport: boolean;
}

/** デバイス情報を収集 */
export function collectDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window,
  };
}

// 並行実行防止フラグ（React StrictMode 下で useEffect が 2 回発火しても
// flushPendingData が重複実行されないようにする）
let flushInProgress = false;

/** localStorage にバッファされた送信待ちデータを再送信
 *
 * 依存関係を守るため、失敗が出たらその時点で停止し、残りのアイテムを
 * そのままバッファに戻す。これにより「trial の insert が失敗したのに
 * 後続の session UPDATE が成功して is_completed が true になる」といった
 * 不整合を防ぐ。
 *
 * 処理中に bufferInsert / bufferUpdate が呼ばれて新しいアイテムが追加されても
 * 消失しないよう、終了時にバッファを再読込して差分をマージする。
 */
export async function flushPendingData(): Promise<void> {
  if (flushInProgress) return;
  flushInProgress = true;

  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return;

    const items: PendingItem[] = JSON.parse(raw);
    const remaining: PendingItem[] = [];
    let stopped = false;

    for (const item of items) {
      if (stopped) {
        remaining.push(item);
        continue;
      }

      // 動的テーブル名のため型チェックをバイパス
      const table = supabase.from(item.table) as ReturnType<typeof supabase.from>;
      let error;

      if (item.op === 'update') {
        let query = table.update(item.data as never);
        for (const [key, value] of Object.entries(item.match)) {
          query = query.eq(key, value);
        }
        ({ error } = await query);
      } else {
        ({ error } = await table.insert(item.data as never));
      }

      if (error) {
        remaining.push(item);
        stopped = true;
      }
    }

    // 処理中に bufferInsert/bufferUpdate で追加されたアイテムを保護するため、
    // 現在のバッファを再読込し、元の件数以降のインデックスにあるものを
    // 新規追加分として merge する
    const currentRaw = localStorage.getItem(BUFFER_KEY);
    const currentItems: PendingItem[] = currentRaw ? JSON.parse(currentRaw) : [];
    const newlyAdded = currentItems.slice(items.length);
    const finalBuffer = [...remaining, ...newlyAdded];

    if (finalBuffer.length > 0) {
      localStorage.setItem(BUFFER_KEY, JSON.stringify(finalBuffer));
    } else {
      localStorage.removeItem(BUFFER_KEY);
    }
  } finally {
    flushInProgress = false;
  }
}

function bufferInsert(table: TableName, data: unknown): void {
  const raw = localStorage.getItem(BUFFER_KEY);
  const items: PendingItem[] = raw ? JSON.parse(raw) : [];
  items.push({ op: 'insert', table, data, createdAt: Date.now() });
  localStorage.setItem(BUFFER_KEY, JSON.stringify(items));
}

function bufferUpdate(table: TableName, data: unknown, match: Record<string, unknown>): void {
  const raw = localStorage.getItem(BUFFER_KEY);
  const items: PendingItem[] = raw ? JSON.parse(raw) : [];
  items.push({ op: 'update', table, data, match, createdAt: Date.now() });
  localStorage.setItem(BUFFER_KEY, JSON.stringify(items));
}

/** セッションを作成し session ID を返す */
export async function createSession(params: {
  participantId: string;
  mode: string;
  note: string;
}): Promise<string> {
  const row = {
    participant_id: params.participantId,
    platform: 'web',
    mode: params.mode,
    note: params.note || null,
    device_info: collectDeviceInfo(),
    started_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(row as never)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/** 1試行分のデータを送信（失敗時は localStorage にバッファ） */
export async function sendTrialData(
  sessionId: string,
  trial: TrialData,
): Promise<void> {
  const trialRow = {
    session_id: sessionId,
    trial_index: trial.trialIndex,
    trial_type: trial.stimulus.type,
    stimulus: trial.stimulus as unknown,
    response: trial.response,
    is_correct: trial.isCorrect,
    reaction_time_ms: trial.reactionTime,
    stimulus_shown_at: new Date(
      Date.now() - (performance.now() - trial.stimulusShownAt),
    ).toISOString(),
  };

  const { data: trialData, error: trialError } = await supabase
    .from('trials')
    .insert(trialRow as never)
    .select('id')
    .single();

  if (trialError) {
    bufferInsert('trials', trialRow);
    return;
  }

  const trialId = trialData.id;

  if (trial.mousePath.length > 0) {
    const mouseRow = {
      trial_id: trialId,
      points: trial.mousePath as unknown,
      point_count: trial.mousePath.length,
      jitter: trial.mouseJitter,
      path_length: trial.mousePathLength,
      max_speed: trial.mouseMaxSpeed,
    };
    const { error } = await supabase.from('web_mouse_paths').insert(mouseRow as never);
    if (error) bufferInsert('web_mouse_paths', mouseRow);
  }

  if (trial.clicks.length > 0) {
    const clickRow = {
      trial_id: trialId,
      events: trial.clicks as unknown,
      event_count: trial.clicks.length,
    };
    const { error } = await supabase.from('web_clicks').insert(clickRow as never);
    if (error) bufferInsert('web_clicks', clickRow);
  }

  if (trial.keystrokes.length > 0) {
    const keystrokeRow = {
      trial_id: trialId,
      events: trial.keystrokes as unknown,
      event_count: trial.keystrokes.length,
    };
    const { error } = await supabase.from('web_keystrokes').insert(keystrokeRow as never);
    if (error) bufferInsert('web_keystrokes', keystrokeRow);
  }
}

/** セッション完了時に集計データを更新（失敗時は localStorage にバッファ） */
export async function completeSession(
  sessionId: string,
  stats: {
    totalTrials: number;
    correctCount: number;
    averageRT: number;
    congruentAvgRT: number;
    incongruentAvgRT: number;
  },
): Promise<void> {
  const updateRow = {
    finished_at: new Date().toISOString(),
    is_completed: true,
    total_trials: stats.totalTrials,
    correct_count: stats.correctCount,
    average_rt: stats.averageRT,
    congruent_avg_rt: stats.congruentAvgRT || null,
    incongruent_avg_rt: stats.incongruentAvgRT || null,
  };

  const { error } = await supabase
    .from('sessions')
    .update(updateRow as never)
    .eq('id', sessionId);

  if (error) {
    bufferUpdate('sessions', updateRow, { id: sessionId });
  }
}
