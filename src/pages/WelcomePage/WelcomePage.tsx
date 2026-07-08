import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <main className="welcome">
      <section className="welcome__hero">
        <p className="eyebrow">Powered by MG67</p>
        <h1>Rider Next</h1>
        <p>Карманный проводник, который помогает понять следующий шаг в мотоциклетной жизни.</p>
        <Link className="primary-action" to="/onboarding">
          Начать
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
