import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  participantId: string;
  onClose: () => void;
}

interface SessionRow {
  id: string;
  mode: string;
  started_at: string;
  finished_at: string | null;
  total_trials: number | null;
  correct_count: number | null;
  average_rt: number | null;
  is_completed: boolean;
  note: string | null;
}

const MODE_LABEL: Record<string, string> = {
  'color-naming': 'Color Naming',
  'incongruent': 'Incongruent',
  'both': 'Both',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatDuration(startedAt: string, finishedAt: string | null): string | null {
  if (!finishedAt) return null;
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return null;
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}秒`;
  return `${min}分${String(sec).padStart(2, '0')}秒`;
}

export function HistoryModal({ participantId, onClose }: Props) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('sessions')
      .select(
        'id, mode, started_at, finished_at, total_trials, correct_count, average_rt, is_completed, note',
      )
      .eq('participant_id', participantId)
      .order('started_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
        } else {
          setSessions((data ?? []) as SessionRow[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-modal" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h2 className="modal-title">過去の記録</h2>
          <button className="history-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        {loading && <p className="history-empty">読み込み中...</p>}

        {!loading && error && (
          <div className="auth-error">取得に失敗しました: {error}</div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <p className="history-empty">まだ記録がありません</p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="history-list">
            {sessions.map(s => {
              const accuracy =
                s.total_trials && s.total_trials > 0
                  ? ((s.correct_count ?? 0) / s.total_trials) * 100
                  : null;
              const duration = formatDuration(s.started_at, s.finished_at);
              return (
                <div key={s.id} className="history-item">
                  <div className="history-item-head">
                    <span className="history-date">{formatDateTime(s.started_at)}</span>
                    <span className={`history-status ${s.is_completed ? 'done' : 'incomplete'}`}>
                      {s.is_completed ? '完了' : '中断'}
                    </span>
                  </div>
                  <div className="history-item-body">
                    <div className="history-cell">
                      <div className="history-cell-label">モード</div>
                      <div className="history-cell-value">{MODE_LABEL[s.mode] ?? s.mode}</div>
                    </div>
                    {accuracy !== null && (
                      <div className="history-cell">
                        <div className="history-cell-label">正答</div>
                        <div className="history-cell-value">
                          {s.correct_count} / {s.total_trials}
                          <span className="history-cell-sub">（{accuracy.toFixed(0)}%）</span>
                        </div>
                      </div>
                    )}
                    {s.average_rt !== null && (
                      <div className="history-cell">
                        <div className="history-cell-label">平均RT</div>
                        <div className="history-cell-value">{Math.round(s.average_rt)} ms</div>
                      </div>
                    )}
                    {duration && (
                      <div className="history-cell">
                        <div className="history-cell-label">所要時間</div>
                        <div className="history-cell-value">{duration}</div>
                      </div>
                    )}
                  </div>
                  {s.note && <div className="history-note">備考: {s.note}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
