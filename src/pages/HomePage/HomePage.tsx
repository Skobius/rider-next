import { ArrowRight, CheckCircle2, Gauge, RotateCcw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMissionForStatus, missions } from '../../data/missions';
import { statusLabels } from '../../data/riderStages';
import { useRiderStore } from '../../features/rider-profile/store';

export function HomePage() {
  const profile = useRiderStore((state) => state.profile);
  const completeMission = useRiderStore((state) => state.completeMission);
  const resetProfile = useRiderStore((state) => state.resetProfile);
  const mission = getMissionForStatus(profile.status);
  const isCompleted = profile.completedMissions.includes(mission.id);
  const totalXp = missions
    .filter((item) => profile.completedMissions.includes(item.id))
    .reduce((sum, item) => sum + item.xp, 0);

  return (
    <section className="page today-page">
      <header className="today-top">
        <div>
          <p className="eyebrow">Сегодня</p>
          <h1>Твой следующий шаг</h1>
        </div>
        <div className="xp-pill">
          <Trophy size={18} />
          <span>{totalXp} XP</span>
        </div>
      </header>

      <article className="mission-hero">
        <div className="mission-hero__status">
          <span>{profile.status ? statusLabels[profile.status] : 'Rider Next'}</span>
          <strong>{isCompleted ? 'Миссия закрыта' : `+${mission.xp} XP`}</strong>
        </div>
        <h2>{mission.title}</h2>
        <p>{mission.subtitle}</p>
        <div className="mentor-note">
          <span>MG67</span>
          <p>{mission.mentorNote}</p>
        </div>
      </article>

      <section className="mission-panel">
        <div className="section-title">
          <h2>Сделай это</h2>
          <span>{mission.tasks.length} шага</span>
        </div>
        <div className="mission-task-list">
          {mission.tasks.map((task, index) => (
            <div className="mission-task" key={task}>
              <span>{index + 1}</span>
              <p>{task}</p>
            </div>
          ))}
        </div>
        <button
          className={isCompleted ? 'primary-action primary-action--done' : 'primary-action'}
          type="button"
          onClick={() => completeMission(mission.id)}
        >
          <CheckCircle2 size={20} />
          {isCompleted ? 'Миссия выполнена' : 'Завершить миссию'}
        </button>
      </section>

      <section className="next-unlock">
        <Gauge size={22} />
        <div>
          <strong>После выполнения</strong>
          <p>{mission.unlocks}</p>
        </div>
      </section>

      <div className="home-actions">
        <Link to="/journey" className="compact-action">
          <ArrowRight size={20} />
          Карта пути
        </Link>
        <Link to="/training" className="compact-action">
          <RotateCcw size={20} />
          Навыки
        </Link>
      </div>

      <button className="ghost-button" type="button" onClick={resetProfile}>
        Сменить стартовую точку
      </button>
    </section>
  );
}
