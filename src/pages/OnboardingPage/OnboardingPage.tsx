import { useNavigate } from 'react-router-dom';
import { statusLabels } from '../../data/riderStages';
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
    <main className="onboarding">
      <header className="page-header">
        <p className="eyebrow">Первый шаг</p>
        <h1>Кто ты сейчас?</h1>
        <p>Выбери ближайшее состояние. Потом его можно будет изменить.</p>
      </header>
      <div className="choice-list">
        {(Object.entries(statusLabels) as [RiderStatus, string][]).map(([status, label]) => (
          <button className="choice-button" key={status} type="button" onClick={() => chooseStatus(status)}>
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}
