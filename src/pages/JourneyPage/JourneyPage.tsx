import { CheckCircle2, Circle } from 'lucide-react';
import { riderStages } from '../../data/riderStages';
import { getCurrentStage } from '../../features/journey/selectors';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function JourneyPage() {
  const profile = useRiderStore((state) => state.profile);
  const toggleChecklist = useRiderStore((state) => state.toggleChecklist);
  const currentStage = getCurrentStage(profile.status);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Карта развития"
        title="Путь райдера"
        description="Не таблица достижений, а понятная последовательность шагов."
      />

      <div className="timeline">
        {riderStages.map((stage) => {
          const isCurrent = stage.id === currentStage.id;
          const isPast = stage.order < currentStage.order;
          return (
            <article className={`stage-card ${isCurrent ? 'stage-card--current' : ''}`} key={stage.id}>
              <div className="stage-card__top">
                <span>{stage.order}</span>
                <div>
                  <h2>{stage.title}</h2>
                  <p>{stage.goal}</p>
                </div>
              </div>
              <div className="checklist">
                {stage.checklist.map((item) => {
                  const done = profile.completedChecklist.includes(item);
                  return (
                    <button key={item} type="button" onClick={() => toggleChecklist(item)}>
                      {done || isPast ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
              <p className="achievement">{stage.achievement}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
