import { useState } from 'react';

interface Props {
  onSignInAnonymously: () => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSignUpWithEmail: (email: string, password: string) => Promise<void>;
  onSignInWithEmail: (email: string, password: string) => Promise<void>;
}

type AuthMode = 'select' | 'email-login' | 'email-register';

export function AuthScreen({
  onSignInAnonymously,
  onSignInWithGoogle,
  onSignUpWithEmail,
  onSignInWithEmail,
}: Props) {
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await action();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '認証エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'email-register') {
      handleAction(() => onSignUpWithEmail(email, password));
    } else {
      handleAction(() => onSignInWithEmail(email, password));
    }
  };

  if (authMode !== 'select') {
    return (
      <div className="screen auth-screen">
        <h1>ストループテスト</h1>
        <p className="description">
          {authMode === 'email-register' ? 'メールアドレスで新規登録' : 'メールアドレスでログイン'}
        </p>

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

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '処理中...' : authMode === 'email-register' ? '新規登録' : 'ログイン'}
          </button>
        </form>

        <div className="auth-switch">
          {authMode === 'email-login' ? (
            <span>
              アカウントをお持ちでない方は
              <button className="btn-link" onClick={() => { setAuthMode('email-register'); setError(''); }}>
                新規登録
              </button>
            </span>
          ) : (
            <span>
              既にアカウントをお持ちの方は
              <button className="btn-link" onClick={() => { setAuthMode('email-login'); setError(''); }}>
                ログイン
              </button>
            </span>
          )}
        </div>

        <button className="btn-back" onClick={() => { setAuthMode('select'); setError(''); }}>
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="screen auth-screen">
      <h1>ストループテスト</h1>
      <p className="description">
        画面に表示される文字の<strong>インクの色</strong>をボタンで選んでください。<br />
        ログイン方法を選択してください。
      </p>

      {error && <div className="auth-error">{error}</div>}

      <div className="auth-buttons">
        <button
          className="btn-auth btn-guest"
          onClick={() => handleAction(onSignInAnonymously)}
          disabled={loading}
        >
          <span className="btn-auth-label">ゲストで始める</span>
          <span className="btn-auth-desc">ログインなしですぐに開始</span>
        </button>

        <button
          className="btn-auth btn-google"
          onClick={() => handleAction(onSignInWithGoogle)}
          disabled={loading}
        >
          <span className="btn-auth-label">Google でログイン</span>
          <span className="btn-auth-desc">Google アカウントで認証</span>
        </button>

        <button
          className="btn-auth btn-email"
          onClick={() => setAuthMode('email-login')}
          disabled={loading}
        >
          <span className="btn-auth-label">メールで登録 / ログイン</span>
          <span className="btn-auth-desc">メールアドレスとパスワードで認証</span>
        </button>
      </div>
    </div>
  );
}
