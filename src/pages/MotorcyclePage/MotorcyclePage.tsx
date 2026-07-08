import { FormEvent } from 'react';
import { maintenanceTasks } from '../../data/maintenanceTasks';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function MotorcyclePage() {
  const profile = useRiderStore((state) => state.profile);
  const saveMotorcycle = useRiderStore((state) => state.saveMotorcycle);
  const addMaintenance = useRiderStore((state) => state.addMaintenance);

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

  function handleMaintenanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    addMaintenance({
      title: String(data.get('title') ?? ''),
      mileage: String(data.get('serviceMileage') ?? ''),
      date: String(data.get('serviceDate') ?? ''),
    });
    form.reset();
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Сервис без сложности"
        title="Мой мотоцикл"
        description="Пока без огромной базы моделей: фиксируем главное и напоминаем о базовых задачах."
      />

      <form className="form-panel" onSubmit={handleMotorcycleSubmit}>
        <label>
          Марка
          <input name="brand" defaultValue={profile.motorcycle?.brand} placeholder="Honda" />
        </label>
        <label>
          Модель
          <input name="model" defaultValue={profile.motorcycle?.model} placeholder="CB500F" />
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
        <button className="primary-action" type="submit">Сохранить мотоцикл</button>
      </form>

      <section className="section-block">
        <h2>Базовые напоминания</h2>
        <div className="task-list">
          {maintenanceTasks.map((task) => (
            <article key={task.title}>
              <strong>{task.title}</strong>
              <span>{task.interval}</span>
            </article>
          ))}
        </div>
      </section>

      <form className="form-panel" onSubmit={handleMaintenanceSubmit}>
        <h2>Записать обслуживание</h2>
        <label>
          Что сделано
          <input name="title" placeholder="Смазал цепь" required />
        </label>
        <div className="form-row">
          <label>
            Пробег
            <input name="serviceMileage" inputMode="numeric" placeholder="13000" />
          </label>
          <label>
            Дата
            <input name="serviceDate" type="date" />
          </label>
        </div>
        <button className="secondary-action" type="submit">Добавить запись</button>
      </form>

      <section className="section-block">
        <h2>История</h2>
        {profile.maintenance.length === 0 ? (
          <p className="muted">Пока записей нет.</p>
        ) : (
          <div className="task-list">
            {profile.maintenance.map((record) => (
              <article key={record.id}>
                <strong>{record.title}</strong>
                <span>{[record.mileage && `${record.mileage} км`, record.date].filter(Boolean).join(' · ')}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
