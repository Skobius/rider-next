import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { findJourneyStage, journeyStages } from '../../data/appStructure';

export function JourneyPage() {
  const { stageId } = useParams();
  const stage = findJourneyStage(stageId);

  if (stage) {
    const Icon = stage.icon;
    return (
      <section className="page detail-page">
        <Link className="back-link" to="/journey">
          <ArrowLeft size={18} />
          Путь новичка
        </Link>

        <header className="detail-hero">
          <span className="detail-hero__icon">
            <Icon size={26} aria-hidden="true" />
          </span>
          <p className="eyebrow">Этап пути</p>
          <h1>{stage.title}</h1>
          <p>{stage.description}</p>
        </header>

        <section className="section-block">
          <h2>Что будет внутри</h2>
          <div className="subsection-list">
            {stage.sections.map((section) => (
              <article key={section} className="subsection-card">
                <strong>{section}</strong>
                <span>Здесь появится короткий материал, чек-лист или видео.</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="page path-page">
      <header className="simple-header">
        <p className="eyebrow">Путь новичка</p>
        <h1>Карта первых сезонов</h1>
        <p>От категории А до первых поездок и зимнего хранения. Открывай этапы постепенно.</p>
      </header>

      <div className="journey-list">
        {journeyStages.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link className="journey-card" key={item.id} to={`/journey/${item.id}`}>
              <span className="journey-card__index">{index + 1}</span>
              <span className="journey-card__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="journey-card__copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
