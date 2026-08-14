import { ArrowLeft, CheckCircle2, LockKeyhole, LogOut, Mail } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../shared/supabase/client';
import { useAuthSession } from '../shared/auth/useAuthSession';

type AuthMode = 'login' | 'signup' | 'reset' | 'update';

function getSafeError(errorMessage?: string) {
  if (!errorMessage) return 'Не удалось выполнить действие. Попробуйте ещё раз.';
  if (errorMessage.toLowerCase().includes('invalid login')) return 'Проверьте email и пароль.';
  if (errorMessage.toLowerCase().includes('email')) return 'Проверьте email и попробуйте ещё раз.';
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

export function AuthPlaceholderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuthSession();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirectTo = useMemo(() => {
    const next = params.get('next');
    return next && next.startsWith('/') ? next : '/profile';
  }, [params]);

  useEffect(() => {
    if (!supabase) return;
    if (params.get('type') === 'recovery' || window.location.hash.includes('type=recovery')) {
      setMode('update');
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update');
    });

    return () => data.subscription.unsubscribe();
  }, [params]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus('');
    setError('');

    if (!supabase) {
      setError('Backend пока не подключён. Добавьте Supabase URL и publishable key в .env.local.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === 'update') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setStatus('Пароль обновлён. Теперь можно продолжить работу.');
        navigate(redirectTo, { replace: true });
        return;
      }

      if (mode === 'signup') {
        if (!acceptedLegal) {
          setError('Нужно принять правила и политику приватности.');
          return;
        }

        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, privacy_accepted: true, terms_accepted: true },
            emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(redirectTo)}`,
          },
        });
        if (authError) throw authError;
        setStatus('Письмо подтверждения отправлено. Проверьте почту.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery&next=${encodeURIComponent('/profile')}`,
      });
      if (resetError) throw resetError;
      setStatus('Если email зарегистрирован, на него придёт письмо для восстановления.');
    } catch (authError) {
      setError(getSafeError(authError instanceof Error ? authError.message : undefined));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setStatus('Вы вышли из аккаунта.');
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <header className="simple-screen__header">
          <p>Аккаунт</p>
          <h1>Backend не подключён</h1>
          <span>Регистрация появится после настройки Supabase для проекта.</span>
        </header>
        <section className="empty-state">
          <div><LockKeyhole size={30} aria-hidden="true" /></div>
          <h2>Нужны Supabase URL и publishable key</h2>
          <p>Добавьте значения в `.env.local`. Service role key нельзя помещать во frontend.</p>
          <span>Гостевой режим продолжает работать.</span>
        </section>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="motohub-screen simple-screen">
        <section className="empty-state">
          <div><LockKeyhole size={30} aria-hidden="true" /></div>
          <h2>Проверяем сессию</h2>
          <p>Секунду.</p>
        </section>
      </section>
    );
  }

  if (user && mode !== 'update') {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <header className="simple-screen__header">
          <p>Аккаунт</p>
          <h1>Вы вошли</h1>
          <span>{user.email}</span>
        </header>
        <section className="empty-state">
          <div><CheckCircle2 size={30} aria-hidden="true" /></div>
          <h2>Аккаунт подключён</h2>
          <p>Теперь можно синхронизировать избранное, предложения и заявки после подключения следующих backend-экранов.</p>
          <button className="profile-primary-action" type="button" onClick={signOut}>
            <LogOut size={17} aria-hidden="true" />
            Выйти
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Аккаунт</p>
        <h1>{mode === 'signup' ? 'Регистрация' : mode === 'reset' ? 'Восстановление пароля' : mode === 'update' ? 'Новый пароль' : 'Вход'}</h1>
        <span>Войдите, чтобы сохранять избранное, предлагать места и подтверждать актуальность.</span>
      </header>

      <div className="search-filter-row">
        <button className={mode === 'login' ? 'is-active' : ''} type="button" onClick={() => setMode('login')}>Вход</button>
        <button className={mode === 'signup' ? 'is-active' : ''} type="button" onClick={() => setMode('signup')}>Регистрация</button>
        <button className={mode === 'reset' ? 'is-active' : ''} type="button" onClick={() => setMode('reset')}>Сброс</button>
      </div>

      <form className="feedback-form" onSubmit={submit}>
        {mode === 'signup' ? (
          <label>
            Имя
            <input className="auth-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Как к вам обращаться" />
          </label>
        ) : null}
        {mode !== 'update' ? (
          <label>
            Email
            <input className="auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="email@example.com" />
          </label>
        ) : null}
        {mode !== 'reset' ? (
          <label>
            {mode === 'update' ? 'Новый пароль' : 'Пароль'}
            <input className="auth-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="Минимум 8 символов" />
          </label>
        ) : null}
        {mode === 'signup' ? (
          <label className="auth-consent">
            <input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} />
            <span>
              Я принимаю <Link to="/terms">правила</Link> и <Link to="/privacy">политику приватности</Link>.
            </span>
          </label>
        ) : null}
        <button className="profile-primary-action" type="submit" disabled={busy}>
          <Mail size={17} aria-hidden="true" />
          {busy ? 'Отправляем...' : mode === 'signup' ? 'Создать аккаунт' : mode === 'reset' ? 'Отправить письмо' : mode === 'update' ? 'Обновить пароль' : 'Войти'}
        </button>
        {status ? <p>{status}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  );
}
