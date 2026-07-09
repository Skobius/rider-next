import { ArrowLeft, ChevronRight, Route } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { findHomeInfoSection, homeInfoSections } from '../../data/appStructure';

export function HomePage() {
  const { sectionId } = useParams();
  const section = findHomeInfoSection(sectionId);

  if (section) {
    const Icon = section.icon;
    return (
      <section className="page detail-page">
        <Link className="back-link" to="/home">
          <ArrowLeft size={18} />
          Главная
        </Link>

        <header className="detail-hero">
          <span className="detail-hero__icon">
            <Icon size={26} aria-hidden="true" />
          </span>
          <p className="eyebrow">Раздел</p>
          <h1>{section.title}</h1>
          <p>{section.intro}</p>
        </header>

        <section className="section-block">
          <h2>Что будет внутри</h2>
          <div className="subsection-list">
            {section.topics.map((topic) => (
              <article className="subsection-card" key={topic}>
                <strong>{topic}</strong>
                <span>Пока короткая заглушка. Позже добавим текст, чек-листы, видео и материалы MG67.</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="page home-hub">
      <header className="home-intro">
        <div className="home-brand">
          <span>Rider Next</span>
          <strong>от MG67 Moto Guide</strong>
        </div>
        <h1>Наставник мотоциклиста</h1>
        <p>
          Права, первый мотоцикл, экипировка, обслуживание, навыки и поездки -
          всё, что нужно новичку в первый сезон.
        </p>
      </header>

      <div className="section-grid">
        {homeInfoSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link className="section-card" key={section.id} to={`/home/${section.id}`}>
              <span className="section-card__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="section-card__copy">
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </span>
              <ChevronRight className="section-card__arrow" size={18} aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <section className="start-helper">
        <div>
          <h2>Не знаешь, с чего начать?</h2>
          <p>Ответь на один вопрос, и Rider Next покажет ближайший следующий шаг.</p>
        </div>
        <Link className="primary-action" to="/onboarding">
          <Route size={20} />
          Подобрать мой следующий шаг
        </Link>
      </section>
    </section>
  );
}
