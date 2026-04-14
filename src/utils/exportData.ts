import type { SessionData, TrialData } from '../types';

// セッション全体をJSONでダウンロード
export function exportSessionJSON(session: SessionData): void {
  const json = JSON.stringify(session, null, 2);
  downloadFile(json, `stroop_${session.participant.id}_${formatDate(session.startedAt)}.json`, 'application/json');
}

// 試行ごとのサマリーをCSVでダウンロード（ML用）
export function exportTrialsCSV(session: SessionData): void {
  const headers = [
    'participant_id', 'age', 'gender', 'handedness',
    'trial_index', 'word', 'word_color', 'correct_answer', 'is_congruent',
    'response', 'is_correct', 'reaction_time_ms',
    'mouse_jitter', 'mouse_path_length', 'mouse_max_speed',
    'click_count', 'avg_click_distance_from_center', 'avg_press_duration_ms',
    'keystroke_count', 'avg_dwell_time_ms',
    'motion_sample_count',
  ].join(',');

  const rows = session.trials.map((t: TrialData) => {
    const avgClickDist = t.clicks.length > 0
      ? t.clicks.reduce((s, c) => s + c.distanceFromCenter, 0) / t.clicks.length
      : 0;
    const avgPressDuration = t.clicks.length > 0
      ? t.clicks.reduce((s, c) => s + c.pressDuration, 0) / t.clicks.length
      : 0;
    const avgDwell = t.keystrokes.length > 0
      ? t.keystrokes.reduce((s, k) => s + k.dwellTime, 0) / t.keystrokes.length
      : 0;

    return [
      session.participant.id,
      session.participant.age,
      session.participant.gender,
      session.participant.handedness,
      t.trialIndex,
      t.stimulus.word,
      t.stimulus.wordColor,
      t.stimulus.correctAnswer,
      t.stimulus.isCongruent ? 1 : 0,
      t.response,
      t.isCorrect ? 1 : 0,
      t.reactionTime.toFixed(2),
      t.mouseJitter.toFixed(4),
      t.mousePathLength.toFixed(2),
      t.mouseMaxSpeed.toFixed(4),
      t.clicks.length,
      avgClickDist.toFixed(2),
      avgPressDuration.toFixed(2),
      t.keystrokes.length,
      avgDwell.toFixed(2),
      t.motionSamples.length,
    ].join(',');
  });

  const csv = [headers, ...rows].join('\n');
  downloadFile(csv, `stroop_trials_${session.participant.id}_${formatDate(session.startedAt)}.csv`, 'text/csv');
}

// マウス軌跡の詳細CSVをダウンロード（必要に応じて使用）
export function exportMousePathCSV(session: SessionData): void {
  const headers = ['participant_id', 'trial_index', 't_ms', 'x', 'y', 'vx', 'vy'].join(',');

  const rows: string[] = [];
  for (const trial of session.trials) {
    for (const p of trial.mousePath) {
      rows.push([
        session.participant.id,
        trial.trialIndex,
        p.t.toFixed(2),
        p.x,
        p.y,
        (p.vx ?? 0).toFixed(4),
        (p.vy ?? 0).toFixed(4),
      ].join(','));
    }
  }

  const csv = [headers, ...rows].join('\n');
  downloadFile(csv, `stroop_mouse_${session.participant.id}_${formatDate(session.startedAt)}.csv`, 'text/csv');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
