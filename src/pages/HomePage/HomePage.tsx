import { ArrowRight, Bike, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { knowledgeArticles } from '../../data/knowledgeArticles';
import { statusLabels } from '../../data/riderStages';
import { getCurrentStage, getNextStage } from '../../features/journey/selectors';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function HomePage() {
  const profile = useRiderStore((state) => state.profile);
  const resetProfile = useRiderStore((state) => state.resetProfile);
  const currentStage = getCurrentStage(profile.status);
  const nextStage = getNextStage(profile.status);
  const completedCount = currentStage.checklist.filter((item) => profile.completedChecklist.includes(item)).length;
  const progress = Math.round((completedCount / currentStage.checklist.length) * 100);
  const article = knowledgeArticles.find((item) => currentStage.linkedArticleIds.includes(item.id));

  return (
    <section className="page">
      <PageHeader
        eyebrow={profile.status ? statusLabels[profile.status] : 'Rider Next'}
        title="Что дальше?"
        description={`Сейчас твой этап - ${currentStage.title.toLowerCase()}.`}
      />

      <article className="next-card">
        <div>
          <p className="eyebrow">Следующий шаг</p>
          <h2>{currentStage.goal}</h2>
          <p>После этого логичный переход: {nextStage.title.toLowerCase()}.</p>
        </div>
        <Link className="primary-action" to="/journey">
          Открыть путь
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </article>

      <div className="progress-panel">
        <div>
          <span>{progress}%</span>
          <p>прогресс текущего этапа</p>
        </div>
        <div className="progress-line">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="quick-grid">
        <Link to="/journey" className="quick-action">
          <CheckCircle2 size={22} />
          <span>Пройти чек-лист</span>
        </Link>
        <Link to="/knowledge" className="quick-action">
          <BookOpen size={22} />
          <span>{article ? article.title : 'Почитать материал'}</span>
        </Link>
        <Link to="/motorcycle" className="quick-action">
          <Bike size={22} />
          <span>Добавить мотоцикл</span>
        </Link>
        <Link to="/training" className="quick-action">
          <RotateCcw size={22} />
          <span>Проверить навык</span>
        </Link>
      </div>

      <button className="ghost-button" type="button" onClick={resetProfile}>
        Сменить статус
      </button>
    </section>
  );
}
