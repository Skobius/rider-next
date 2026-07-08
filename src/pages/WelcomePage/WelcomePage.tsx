import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <main className="welcome">
      <section className="welcome-card">
        <div className="brand-mark">
          <span>RN</span>
          <strong>Powered by MG67</strong>
        </div>
        <div className="welcome-copy">
          <p className="eyebrow">Rider Next</p>
          <h1>Первый наставник после категории А.</h1>
          <p>
            Получил права, купил мотоцикл или только собираешься? Приложение подскажет,
            что делать дальше: мотоцикл, экипировка, навыки, обслуживание и первые поездки.
          </p>
        </div>
        <Link className="primary-action" to="/onboarding">
          Начать путь
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
