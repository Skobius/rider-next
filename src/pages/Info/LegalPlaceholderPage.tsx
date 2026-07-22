import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/useI18n';

export function LegalPlaceholderPage({ title }: { title: string }) {
  const { t } = useI18n();

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('legal.kicker')}</p>
        <h1>{title}</h1>
        <span>{t('legal.subtitle')}</span>
      </header>
      <section className="article-card">
        <h2>{t('legal.title')}</h2>
        <p>{t('legal.text')}</p>
      </section>
    </section>
  );
}
