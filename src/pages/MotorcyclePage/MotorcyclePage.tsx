import { FormEvent } from 'react';
import { maintenanceTasks } from '../../data/maintenanceTasks';
import { getMissionForStatus } from '../../data/missions';
import { useRiderStore } from '../../features/rider-profile/store';
import { PageHeader } from '../../shared/ui/PageHeader';

export function MotorcyclePage() {
  const profile = useRiderStore((state) => state.profile);
  const saveMotorcycle = useRiderStore((state) => state.saveMotorcycle);
  const addMaintenance = useRiderStore((state) => state.addMaintenance);
  const mission = getMissionForStatus(profile.status);
  const activeTasks = maintenanceTasks.filter((task) => mission.garageTasks.includes(task.title));

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
        eyebrow="Гараж"
        title="Состояние байка"
        description="Минимум бюрократии: мотоцикл, пробег и то, что важно проверить перед следующей миссией."
      />

      {activeTasks.length > 0 ? (
        <section className="mission-panel garage-focus">
          <div className="section-title">
            <h2>Нужно для миссии</h2>
            <span>{mission.title}</span>
          </div>
          <div className="task-list">
            {activeTasks.map((task) => (
              <article key={task.title}>
                <strong>{task.title}</strong>
                <span>{task.interval}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
        <button className="primary-action" type="submit">Сохранить байк</button>
      </form>

      <section className="section-block">
        <h2>Базовые проверки</h2>
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
