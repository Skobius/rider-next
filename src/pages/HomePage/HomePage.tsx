import {
  Bike,
  CircleHelp,
  GraduationCap,
  MapPin,
  Route,
  ShieldCheck,
  Shirt,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const homeSections = [
  {
    title: 'Категория А',
    text: 'Где учиться, как проходит обучение, что делать после экзамена.',
    icon: GraduationCap,
  },
  {
    title: 'Первый мотоцикл',
    text: 'Как выбрать, на что смотреть, какие ошибки не совершить.',
    icon: Bike,
  },
  {
    title: 'Экипировка',
    text: 'Что купить в первую очередь и где искать.',
    icon: Shirt,
  },
  {
    title: 'Обслуживание',
    text: 'Масло, цепь, резина, ТО, зимнее хранение.',
    icon: Wrench,
  },
  {
    title: 'Навыки и тренировки',
    text: 'Как ездить увереннее, что тренировать, зачем контраварийка.',
    icon: ShieldCheck,
  },
  {
    title: 'Куда поехать',
    text: 'Маршруты, события, мототуры, места в Смоленске.',
    icon: MapPin,
  },
  {
    title: 'Вопросы новичка',
    text: 'Быстрые ответы на частые вопросы после категории А.',
    icon: CircleHelp,
  },
];

export function HomePage() {
  return (
    <section className="page home-hub">
      <header className="home-intro">
        <div className="home-brand">
          <span>Rider Next</span>
          <strong>от MG67 Moto Guide</strong>
        </div>
        <h1>Первый помощник после категории А</h1>
        <p>
          Права, первый мотоцикл, экипировка, обслуживание, навыки и поездки - всё,
          что нужно новичку в первые сезоны.
        </p>
      </header>

      <div className="section-grid">
        {homeSections.map((section) => {
          const Icon = section.icon;
          return (
            <button className="section-card" key={section.title} type="button">
              <span className="section-card__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="section-card__copy">
                <strong>{section.title}</strong>
                <small>{section.text}</small>
              </span>
            </button>
          );
        })}
      </div>

      <section className="start-helper">
        <div>
          <h2>Не знаешь, с чего начать?</h2>
          <p>Ответь на один вопрос, и Rider Next покажет ближайший следующий шаг.</p>
        </div>
        <Link className="primary-action" to="/onboarding">
          <Route size={20} />
          Подобрать мой следующий шаг
        </Link>
      </section>
    </section>
  );
}
