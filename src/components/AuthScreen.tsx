import { useState } from 'react';
import { PasswordInput } from './PasswordInput';

interface Props {
  onSignInAnonymously: () => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSignUpWithEmail: (email: string, password: string) => Promise<void>;
  onSignInWithEmail: (email: string, password: string) => Promise<void>;
  onResetPasswordForEmail: (email: string) => Promise<void>;
}

type AuthMode = 'select' | 'email-login' | 'email-register' | 'forgot-password';

export function AuthScreen({
  onSignInAnonymously,
  onSignInWithGoogle,
  onSignUpWithEmail,
  onSignInWithEmail,
  onResetPasswordForEmail,
}: Props) {
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  // ログイン失敗後にパスワードリセット導線を出すための状態
  const [showResetPrompt, setShowResetPrompt] = useState(false);

  const resetState = (mode: AuthMode) => {
    setAuthMode(mode);
    setError('');
    setInfo('');
    setShowResetPrompt(false);
    setPasswordConfirm('');
  };

  const handleAction = async (action: () => Promise<void>, onSuccessInfo?: string) => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await action();
      if (onSuccessInfo) setInfo(onSuccessInfo);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '認証エラーが発生しました');
      // ログイン失敗時はパスワードリセット導線を表示
      if (authMode === 'email-login') {
        setShowResetPrompt(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 新規登録時のパスワード一致チェック
  const passwordsMatch = password === passwordConfirm;
  const canSubmitRegister =
    !!email && !!password && password.length >= 6 && passwordsMatch;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'email-register') {
      if (!canSubmitRegister) return;
      handleAction(() => onSignUpWithEmail(email, password));
    } else {
      handleAction(() => onSignInWithEmail(email, password));
    }
  };

  const handleSendResetEmail = () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    handleAction(
      () => onResetPasswordForEmail(email),
      'パスワードリセット用のメールを送信しました。受信トレイをご確認ください。',
    );
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendResetEmail();
  };

  // パスワード忘れ画面
  if (authMode === 'forgot-password') {
    return (
      <div className="screen auth-screen">
        <h1>ストループテスト</h1>
        <p className="description">パスワードリセット用のメールを送信します</p>

        <form onSubmit={handleForgotPasswordSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-email">メールアドレス</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button type="submit" className="btn-primary" disabled={loading || !email}>
            {loading ? '送信中...' : 'リセットメールを送信'}
          </button>
        </form>

        <button className="btn-back" onClick={() => resetState('email-login')}>
          ログイン画面に戻る
        </button>
      </div>
    );
  }

  // 新規登録 or ログイン画面
  if (authMode !== 'select') {
    const isRegister = authMode === 'email-register';

    return (
      <div className="screen auth-screen">
        <h1>ストループテスト</h1>
        <p className="description">
          {isRegister ? 'メールアドレスで新規登録' : 'メールアドレスでログイン'}
        </p>

        <form onSubmit={handleEmailSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">メールアドレス</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">パスワード</label>
            <PasswordInput
              id="auth-password"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              placeholder="6文字以上"
              disabled={loading}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-password-confirm">パスワード（確認）</label>
              <PasswordInput
                id="auth-password-confirm"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                required
                minLength={6}
                placeholder="もう一度入力"
                disabled={loading}
                autoComplete="new-password"
              />
              {passwordConfirm.length > 0 && !passwordsMatch && (
                <div className="field-error">パスワードが一致しません</div>
              )}
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          {/* ログイン失敗時のリセット導線 */}
          {showResetPrompt && !isRegister && (
            <div className="reset-prompt">
              <button
                type="button"
                className="btn-link"
                onClick={handleSendResetEmail}
                disabled={loading}
              >
                このメールアドレスにパスワードリセットメールを送る
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (isRegister && !canSubmitRegister)}
          >
            {loading ? '処理中...' : isRegister ? '新規登録' : 'ログイン'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <span>
              既にアカウントをお持ちの方は
              <button className="btn-link" onClick={() => resetState('email-login')}>
                ログイン
              </button>
            </span>
          ) : (
            <>
              <span>
                アカウントをお持ちでない方は
                <button className="btn-link" onClick={() => resetState('email-register')}>
                  新規登録
                </button>
              </span>
              <div className="forgot-password-link">
                <button className="btn-link" onClick={() => resetState('forgot-password')}>
                  パスワードをお忘れの方
                </button>
              </div>
            </>
          )}
        </div>

        <button className="btn-back" onClick={() => resetState('select')}>
          戻る
        </button>
      </div>
    );
  }

  // 認証方式選択画面
  return (
    <div className="screen auth-screen">
      <h1>ストループテスト</h1>
      <p className="description">
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
          onClick={() => resetState('email-login')}
          disabled={loading}
        >
          <span className="btn-auth-label">メールで登録 / ログイン</span>
          <span className="btn-auth-desc">メールアドレスとパスワードで認証</span>
        </button>
      </div>
    </div>
  );
}
