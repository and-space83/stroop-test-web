import { useState } from 'react';
import type { Participant } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  authUserId: string;
  isGuest: boolean;
  authProvider: string;
  email: string | null;
  onSaved: (participant: Participant) => void;
}

export function ParticipantForm({ authUserId, isGuest, authProvider, email, onSaved }: Props) {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Participant['gender']>('male');
  const [handedness, setHandedness] = useState<Participant['handedness']>('right');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('participants')
        .insert({
          auth_user_id: authUserId,
          age: Number(age),
          gender,
          handedness,
          is_guest: isGuest,
          auth_provider: authProvider,
          email,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const participant: Participant = {
        id: data.id,
        age: data.age,
        gender: data.gender as Participant['gender'],
        handedness: data.handedness as Participant['handedness'],
        createdAt: new Date(data.created_at).getTime(),
      };

      onSaved(participant);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen form-screen">
      <h1>被験者情報の入力</h1>
      <p className="description">
        初回のみ入力が必要です。以降はこの画面はスキップされます。
      </p>

      <form onSubmit={handleSubmit} className="participant-form">
        <div className="form-group">
          <label>年齢</label>
          <input
            type="number"
            min={5}
            max={120}
            value={age}
            onChange={e => setAge(e.target.value)}
            required
            placeholder="例: 25"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>性別</label>
          <div className="radio-group">
            {(['male', 'female', 'other'] as const).map(v => (
              <label key={v} className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value={v}
                  checked={gender === v}
                  onChange={() => setGender(v)}
                  disabled={saving}
                />
                {v === 'male' ? '男性' : v === 'female' ? '女性' : 'その他'}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>利き手</label>
          <div className="radio-group">
            {(['right', 'left'] as const).map(v => (
              <label key={v} className="radio-label">
                <input
                  type="radio"
                  name="handedness"
                  value={v}
                  checked={handedness === v}
                  onChange={() => setHandedness(v)}
                  disabled={saving}
                />
                {v === 'right' ? '右利き' : '左利き'}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={!age || saving}>
          {saving ? '保存中...' : '保存して次へ'}
        </button>
      </form>
    </div>
  );
}
