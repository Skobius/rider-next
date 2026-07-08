import { CheckCircle2, RotateCcw } from 'lucide-react';
import { getMissionForStatus } from '../../data/missions';
import { trainingSkills } from '../../data/trainingSkills';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function TrainingPage() {
  const profile = useRiderStore((state) => state.profile);
  const toggleSkillDone = useRiderStore((state) => state.toggleSkillDone);
  const toggleSkillRepeat = useRiderStore((state) => state.toggleSkillRepeat);
  const mission = getMissionForStatus(profile.status);
  const sortedSkills = [...trainingSkills].sort((a, b) => {
    const aRelevant = mission.skillIds.includes(a.id) ? 0 : 1;
    const bRelevant = mission.skillIds.includes(b.id) ? 0 : 1;
    return aRelevant - bRelevant;
  });

  return (
    <section className="page">
      <PageHeader
        eyebrow="Практика"
        title="Тренировки"
        description="Сначала навыки, которые помогают закрыть текущую миссию. Остальное можно трогать позже."
      />

      <div className="skill-list">
        {sortedSkills.map((skill) => {
          const done = profile.completedSkills.includes(skill.id);
          const repeat = profile.repeatSkills.includes(skill.id);
          const isMissionSkill = mission.skillIds.includes(skill.id);
          return (
            <article className={isMissionSkill ? 'skill-card skill-card--focus' : 'skill-card'} key={skill.id}>
              <div className="skill-card__top">
                <span>{skill.difficulty}</span>
                {isMissionSkill ? <strong>Для миссии</strong> : null}
                <h2>{skill.title}</h2>
              </div>
              <p>{skill.why}</p>
              <p><strong>Как проверить:</strong> {skill.check}</p>
              <div className="mistakes">
                {skill.mistakes.map((mistake) => <span key={mistake}>{mistake}</span>)}
              </div>
              <div className="button-row">
                <button className={done ? 'state-button state-button--active' : 'state-button'} type="button" onClick={() => toggleSkillDone(skill.id)}>
                  <CheckCircle2 size={18} />
                  Сделано
                </button>
                <button className={repeat ? 'state-button state-button--warn' : 'state-button'} type="button" onClick={() => toggleSkillRepeat(skill.id)}>
                  <RotateCcw size={18} />
                  Повторить
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
