import { useState } from 'react';

interface Props {
  onLinkGoogle: () => Promise<void>;
  onLinkEmail: (email: string, password: string) => Promise<void>;
  onClose: () => void;
}

type UpgradeMode = 'select' | 'email';

export function UpgradeAccountModal({ onLinkGoogle, onLinkEmail, onClose }: Props) {
  const [mode, setMode] = useState<UpgradeMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await action();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction(() => onLinkEmail(email, password));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal upgrade-modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">アカウントを登録しませんか？</h2>
        <p className="modal-description">
          登録すると、次回以降もデータが引き継がれます。
        </p>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'select' ? (
          <div className="upgrade-buttons">
            <button
              className="btn-auth btn-google"
              onClick={() => handleAction(onLinkGoogle)}
              disabled={loading}
            >
              <span className="btn-auth-label">Google で登録</span>
            </button>
            <button
              className="btn-auth btn-email"
              onClick={() => setMode('email')}
              disabled={loading}
            >
              <span className="btn-auth-label">メールで登録</span>
            </button>
            <button className="btn-skip" onClick={onClose} disabled={loading}>
              今はスキップ
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <div className="form-group">
              <label>メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="example@mail.com"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6文字以上"
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '処理中...' : '登録する'}
            </button>
            <button
              type="button"
              className="btn-back"
              onClick={() => { setMode('select'); setError(''); }}
              disabled={loading}
            >
              戻る
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
