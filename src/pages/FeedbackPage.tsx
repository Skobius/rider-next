import { ArrowLeft, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { socialLinks } from '../config/socialLinks';
import { useI18n } from '../shared/i18n/useI18n';

export function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const { t } = useI18n();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      setStatus(t('feedback.emptyStatus'));
      return;
    }

    if (!socialLinks.feedbackEmail) {
      setStatus(t('feedback.channelPending'));
      setMessage('');
      return;
    }

    const subject = encodeURIComponent(t('feedback.subject'));
    const body = encodeURIComponent(`${message}\n\n${t('feedback.bodyScreen')}: ${window.location.pathname}\n${t('feedback.bodyVersion')}: 0.2.0`);
    window.location.href = `mailto:${socialLinks.feedbackEmail}?subject=${subject}&body=${body}`;
    setStatus(t('feedback.sentStatus'));
    setMessage('');
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('feedback.kicker')}</p>
        <h1>{t('feedback.title')}</h1>
        <span>{t('feedback.subtitle')}</span>
      </header>
      <form className="feedback-form" onSubmit={submit}>
        <label>
          {t('feedback.label')}
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t('feedback.placeholder')} />
        </label>
        <button className="profile-primary-action" type="submit">
          <Mail size={17} aria-hidden="true" />
          {t('feedback.send')}
        </button>
        {status ? <p>{status}</p> : null}
      </form>
    </section>
  );
}
