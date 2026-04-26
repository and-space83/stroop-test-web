import { useState } from 'react';
import { PasswordInput } from './PasswordInput';

interface Props {
  onUpdatePassword: (newPassword: string) => Promise<void>;
  onFinish: () => void;
}

export function PasswordRecoveryScreen({ onUpdatePassword, onFinish }: Props) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === passwordConfirm;
  const canSubmit = password.length >= 6 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setInfo('');
    setLoading(true);
    try {
      await onUpdatePassword(password);
      setInfo('パスワードを更新しました。続けてご利用いただけます。');
      // 少しだけ余韻を残してリカバリーモード解除（自動的にホーム導線に遷移）
      setTimeout(() => {
        onFinish();
      }, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'パスワードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen auth-screen">
      <h1>新しいパスワードを設定</h1>
      <p className="description">
        受信したメールのリンクから来た方は、ここで新しいパスワードを設定してください。
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="recovery-password">新しいパスワード</label>
          <PasswordInput
            id="recovery-password"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
            placeholder="6文字以上"
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="recovery-password-confirm">新しいパスワード（確認）</label>
          <PasswordInput
            id="recovery-password-confirm"
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

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
          {loading ? '更新中...' : 'パスワードを更新'}
        </button>
      </form>
    </div>
  );
}
