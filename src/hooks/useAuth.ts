import { useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isRecoveringPassword: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isGuest: false,
    isRecoveringPassword: false,
  });

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false,
        isGuest: session?.user?.is_anonymous ?? false,
        isRecoveringPassword: false,
      });
    });

    // セッション変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          session,
          user: session?.user ?? null,
          loading: false,
          isGuest: session?.user?.is_anonymous ?? false,
          // パスワードリセットメールのリンクから戻ってきた直後は新パスワード設定モード
          isRecoveringPassword:
            event === 'PASSWORD_RECOVERY' ? true : prev.isRecoveringPassword,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /** ゲスト（匿名）ログイン */
  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  };

  /** Google OAuth ログイン */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  /** メール＋パスワードで新規登録 */
  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  /** メール＋パスワードでログイン */
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  /** ログアウト */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /** ゲストアカウントにメールを紐付け（アップグレード） */
  const linkEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;
  };

  /** ゲストアカウントにGoogleを紐付け（アップグレード） */
  const linkGoogle = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  /** パスワードリセットメールを送信 */
  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  /** パスワードを更新（リカバリーフロー or 認証済み時のパスワード変更で使用） */
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  /** リカバリーモードを終了（新パスワード設定後に呼ぶ） */
  const finishPasswordRecovery = () => {
    setAuthState(prev => ({ ...prev, isRecoveringPassword: false }));
  };

  return {
    ...authState,
    signInAnonymously,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    linkEmail,
    linkGoogle,
    resetPasswordForEmail,
    updatePassword,
    finishPasswordRecovery,
  };
}
