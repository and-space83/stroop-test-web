import { useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  autoComplete?: string;
  id?: string;
}

/**
 * パスワード入力欄。
 * 目アイコンを **押している間だけ** パスワードを表示する（press-and-hold）。
 * クリックトグルや自動隠蔽より露出時間を短くできるため、ショルダーハッキング対策として有効。
 */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  disabled,
  minLength,
  autoComplete,
  id,
}: Props) {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return (
    <div className="password-input">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle"
        // マウス・タッチ・ペンを統一して扱える Pointer Events
        onPointerDown={show}
        onPointerUp={hide}
        onPointerLeave={hide}
        onPointerCancel={hide}
        // キーボード（Space/Enter）でも press-and-hold を再現
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            show();
          }
        }}
        onKeyUp={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            hide();
          }
        }}
        // 長押しでスマホのコンテキストメニューが出るのを抑止
        onContextMenu={e => e.preventDefault()}
        aria-label="押し続けるとパスワードを表示"
        title="押し続けるとパスワードを表示"
        tabIndex={-1}
        disabled={disabled}
      >
        {visible ? (
          // 表示中: 目に斜線（今見えていることを示す）
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          // 非表示中: 目アイコン
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
