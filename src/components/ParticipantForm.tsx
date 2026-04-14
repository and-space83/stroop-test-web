import { useState } from 'react';
import type { Participant } from '../types';

interface Props {
  onSubmit: (participant: Participant) => void;
}

export function ParticipantForm({ onSubmit }: Props) {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Participant['gender']>('male');
  const [handedness, setHandedness] = useState<Participant['handedness']>('right');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const participant: Participant = {
      id: `P${Date.now()}`,
      age: Number(age),
      gender,
      handedness,
      note,
      createdAt: Date.now(),
    };
    onSubmit(participant);
  };

  return (
    <div className="screen form-screen">
      <h1>ストループテスト</h1>
      <p className="description">
        画面に表示される文字の<strong>インクの色</strong>をボタンで選んでください。
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
                />
                {v === 'right' ? '右利き' : '左利き'}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>備考（任意）</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="例: 症例名・測定日など"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={!age}>
          テストを開始する
        </button>
      </form>
    </div>
  );
}
