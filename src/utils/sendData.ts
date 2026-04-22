import { supabase } from '../lib/supabase';
import type { TrialData } from '../types';
import type { Database } from '../types/database.types';

type TableName = keyof Database['public']['Tables'];

const BUFFER_KEY = 'stroop_pending_sends';

interface PendingItem {
  table: TableName;
  data: unknown;
  createdAt: number;
}

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

/** localStorage にバッファされた送信待ちデータを再送信 */
export async function flushPendingData(): Promise<void> {
  const raw = localStorage.getItem(BUFFER_KEY);
  if (!raw) return;

  const items: PendingItem[] = JSON.parse(raw);
  const remaining: PendingItem[] = [];

  for (const item of items) {
    // 動的テーブル名のため型チェックをバイパス
    const { error } = await (supabase.from(item.table) as ReturnType<typeof supabase.from>)
      .insert(item.data as never);
    if (error) {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(remaining));
  } else {
    localStorage.removeItem(BUFFER_KEY);
  }
}

function bufferToLocalStorage(table: TableName, data: unknown): void {
  const raw = localStorage.getItem(BUFFER_KEY);
  const items: PendingItem[] = raw ? JSON.parse(raw) : [];
  items.push({ table, data, createdAt: Date.now() });
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
    bufferToLocalStorage('trials', trialRow);
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
    if (error) bufferToLocalStorage('web_mouse_paths', mouseRow);
  }

  if (trial.clicks.length > 0) {
    const clickRow = {
      trial_id: trialId,
      events: trial.clicks as unknown,
      event_count: trial.clicks.length,
    };
    const { error } = await supabase.from('web_clicks').insert(clickRow as never);
    if (error) bufferToLocalStorage('web_clicks', clickRow);
  }

  if (trial.keystrokes.length > 0) {
    const keystrokeRow = {
      trial_id: trialId,
      events: trial.keystrokes as unknown,
      event_count: trial.keystrokes.length,
    };
    const { error } = await supabase.from('web_keystrokes').insert(keystrokeRow as never);
    if (error) bufferToLocalStorage('web_keystrokes', keystrokeRow);
  }
}

/** セッション完了時に集計データを更新 */
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
  const { error } = await supabase
    .from('sessions')
    .update({
      finished_at: new Date().toISOString(),
      is_completed: true,
      total_trials: stats.totalTrials,
      correct_count: stats.correctCount,
      average_rt: stats.averageRT,
      congruent_avg_rt: stats.congruentAvgRT || null,
      incongruent_avg_rt: stats.incongruentAvgRT || null,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to complete session:', error);
  }
}
