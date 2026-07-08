import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onboardingStatuses, statusLabels } from '../../data/firstExperience';
import { useRiderStore } from '../../features/rider-profile/store';
import type { RiderStatus } from '../../shared/types/domain';

export function OnboardingPage() {
  const navigate = useNavigate();
  const setStatus = useRiderStore((state) => state.setStatus);

  function chooseStatus(status: RiderStatus) {
    setStatus(status);
    navigate('/home');
  }

  return (
    <main className="onboarding screen-card">
      <header className="simple-header">
        <p className="eyebrow">Первый вопрос</p>
        <h1>Где ты сейчас на пути?</h1>
        <p>Выбери один вариант. Rider Next покажет ближайший следующий шаг.</p>
      </header>
      <div className="choice-list">
        {onboardingStatuses.map((status) => (
          <button className="choice-button" key={status} type="button" onClick={() => chooseStatus(status)}>
            <span>{statusLabels[status]}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
    </main>
  );
}
