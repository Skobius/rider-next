import { CheckCircle2, Lock, MapPin } from 'lucide-react';
import { getMissionByStage } from '../../data/missions';
import { riderStages } from '../../data/riderStages';
import { getCurrentStage } from '../../features/journey/selectors';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function JourneyPage() {
  const profile = useRiderStore((state) => state.profile);
  const currentStage = getCurrentStage(profile.status);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Карта миссий"
        title="Путь райдера"
        description="Здесь не нужно читать всё сразу. Двигайся от ближайшей миссии к следующей."
      />

      <div className="mission-map">
        {riderStages.map((stage) => {
          const mission = getMissionByStage(stage.id);
          const isCurrent = stage.id === currentStage.id;
          const isPast = stage.order < currentStage.order;
          const isDone = mission ? profile.completedMissions.includes(mission.id) : isPast;

          return (
            <article className={`map-node ${isCurrent ? 'map-node--current' : ''}`} key={stage.id}>
              <div className="map-node__marker">
                {isDone ? <CheckCircle2 size={22} /> : isCurrent ? <MapPin size={22} /> : <Lock size={20} />}
              </div>
              <div className="map-node__content">
                <span>Уровень {stage.order}</span>
                <h2>{stage.title}</h2>
                <p>{mission?.title ?? stage.goal}</p>
                {mission ? <strong>Награда: +{mission.xp} XP</strong> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
