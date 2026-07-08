import { Bike, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { nextSteps, statusLabels } from '../../data/firstExperience';
import { useRiderStore } from '../../features/rider-profile/store';

export function HomePage() {
  const profile = useRiderStore((state) => state.profile);
  const resetProfile = useRiderStore((state) => state.resetProfile);
  const status = profile.status ?? 'licensed';
  const nextStep = nextSteps[status];

  return (
    <section className="page first-step-page">
      <header className="simple-header">
        <p className="eyebrow">Твой следующий шаг</p>
        <h1>{nextStep.headline}</h1>
        <p>{statusLabels[status]}</p>
      </header>

      <article className="next-step-card">
        <div className="next-step-card__label">Что дальше?</div>
        <h2>{nextStep.step}</h2>
        <div className="mentor-note">
          <span>MG67 Moto Guide</span>
          <p>{nextStep.note}</p>
        </div>
      </article>

      <section className="action-card">
        <h2>Что важно сейчас</h2>
        <div className="clean-list">
          {nextStep.important.map((item, index) => (
            <div key={item} className="clean-list__item">
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="primary-grid">
        <Link className="primary-action" to="/journey">
          <Map size={20} />
          Посмотреть план
        </Link>
        <Link className="secondary-action" to="/motorcycle">
          <Bike size={20} />
          Добавить мотоцикл
        </Link>
      </div>

      <button className="ghost-button" type="button" onClick={resetProfile}>
        Выбрать другое состояние
      </button>
    </section>
  );
}
