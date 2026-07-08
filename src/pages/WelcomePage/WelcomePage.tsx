import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <main className="welcome">
      <section className="welcome__hero">
        <p className="eyebrow">Powered by MG67</p>
        <h1>Rider Next</h1>
        <p>Мото-наставник с короткими миссиями: меньше хаоса, больше понятных шагов.</p>
        <Link className="primary-action" to="/onboarding">
          Выбрать старт
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
