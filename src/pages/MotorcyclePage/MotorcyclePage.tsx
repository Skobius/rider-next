import { FormEvent } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { findMotorcycleTopic, motorcycleTopics } from '../../data/appStructure';
import { useRiderStore } from '../../features/rider-profile/store';

export function MotorcyclePage() {
  const { topicId } = useParams();
  const topic = findMotorcycleTopic(topicId);
  const profile = useRiderStore((state) => state.profile);
  const saveMotorcycle = useRiderStore((state) => state.saveMotorcycle);
  const bikeName = profile.motorcycle?.brand || profile.motorcycle?.model
    ? `${profile.motorcycle?.brand ?? ''} ${profile.motorcycle?.model ?? ''}`.trim()
    : 'Мой мотоцикл';

  function handleMotorcycleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveMotorcycle({
      brand: String(data.get('brand') ?? ''),
      model: String(data.get('model') ?? ''),
      year: String(data.get('year') ?? ''),
      mileage: String(data.get('mileage') ?? ''),
      purchaseDate: String(data.get('purchaseDate') ?? ''),
      notes: String(data.get('notes') ?? ''),
    });
  }

  if (topic) {
    const Icon = topic.icon;
    return (
      <section className="page detail-page">
        <Link className="back-link" to="/motorcycle">
          <ArrowLeft size={18} />
          Мотоцикл
        </Link>

        <header className="detail-hero">
          <span className="detail-hero__icon">
            <Icon size={26} aria-hidden="true" />
          </span>
          <p className="eyebrow">Карточка байка</p>
          <h1>{topic.title}</h1>
          <p>{topic.description}</p>
        </header>

        <section className="section-block">
          <h2>Что здесь будет</h2>
          <div className="subsection-list">
            {['Краткая инструкция', 'Когда проверять', 'Что записывать', 'Типичные ошибки'].map((item) => (
              <article className="subsection-card" key={item}>
                <strong>{item}</strong>
                <span>Пока заглушка. Позже добавим понятный материал MG67.</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="page motorcycle-page">
      <header className="simple-header">
        <p className="eyebrow">Мотоцикл</p>
        <h1>Помощник владельца байка</h1>
        <p>Не CRM. Просто главное состояние мотоцикла и базовые вещи, за которыми стоит следить.</p>
      </header>

      <section className="bike-summary">
        <div>
          <span>{profile.motorcycle?.year || 'год не указан'}</span>
          <h2>{bikeName}</h2>
          <p>{profile.motorcycle?.mileage ? `${profile.motorcycle.mileage} км` : 'Добавь пробег, чтобы видеть картину понятнее.'}</p>
        </div>
        <div className="bike-summary__stats">
          <article>
            <strong>{profile.maintenance[0]?.date || 'нет записи'}</strong>
            <span>Последнее ТО</span>
          </article>
          <article>
            <strong>план</strong>
            <span>Следующее ТО</span>
          </article>
        </div>
      </section>

      <div className="topic-grid">
        {motorcycleTopics.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="topic-card" key={item.id} to={`/motorcycle/${item.id}`}>
              <span className="topic-card__icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.status}</small>
              </span>
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <form className="form-panel compact-form" onSubmit={handleMotorcycleSubmit}>
        <h2>Данные мотоцикла</h2>
        <label>
          Марка
          <input name="brand" defaultValue={profile.motorcycle?.brand} placeholder="Honda" />
        </label>
        <label>
          Модель
          <input name="model" defaultValue={profile.motorcycle?.model} placeholder="CB500X" />
        </label>
        <div className="form-row">
          <label>
            Год
            <input name="year" defaultValue={profile.motorcycle?.year} inputMode="numeric" placeholder="2020" />
          </label>
          <label>
            Пробег
            <input name="mileage" defaultValue={profile.motorcycle?.mileage} inputMode="numeric" placeholder="12500" />
          </label>
        </div>
        <label>
          Дата покупки
          <input name="purchaseDate" defaultValue={profile.motorcycle?.purchaseDate} type="date" />
        </label>
        <label>
          Заметки
          <textarea name="notes" defaultValue={profile.motorcycle?.notes} placeholder="Что важно помнить" />
        </label>
        <button className="primary-action" type="submit">Сохранить</button>
      </form>
    </section>
  );
}
