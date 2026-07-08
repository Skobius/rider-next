import { CheckCircle2 } from 'lucide-react';
import { beginnerPath } from '../../data/firstExperience';

export function JourneyPage() {
  return (
    <section className="page path-page">
      <header className="simple-header">
        <p className="eyebrow">Путь новичка</p>
        <h1>Не всё сразу. Вот нормальная последовательность.</h1>
        <p>Это короткая карта, чтобы не тонуть в советах, видео и случайных мнениях.</p>
      </header>

      <div className="path-list">
        {beginnerPath.map((item, index) => (
          <article className="path-item" key={item}>
            <div className="path-item__number">{index + 1}</div>
            <div>
              <h2>{item}</h2>
              <p>{index === 0 ? 'Начни с ближайшего шага. Остальное можно открывать постепенно.' : 'Этот шаг появится, когда будет нужен.'}</p>
            </div>
            {index === 0 ? <CheckCircle2 size={22} aria-hidden="true" /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
