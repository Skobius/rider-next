import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, Heart, MapPin, Navigation, ShieldCheck, Star, Wrench } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { SearchItemType } from '../../data/searchContent';
import { findSearchItem } from '../../features/search/searchLinks';
import { getLocalizedText, type LocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { toggleFavorite, useFavorites } from '../../shared/storage/favoritesStore';
import { showToast } from '../../shared/ui/toastStore';

const categoryLabelById = {
  service: 'search.categoryService',
  equipment: 'search.categoryEquipment',
  route: 'search.categoryRoute',
  event: 'search.categoryEvent',
  training: 'search.categoryTraining',
  insurance: 'search.categoryInsurance',
  fuel: 'search.categoryFuel',
  storage: 'search.categoryStorage',
};

const typeMeta = {
  place: {
    kicker: 'details.place',
    icon: Wrench,
    fallback: '/search?type=place',
  },
  route: {
    kicker: 'details.route',
    icon: Navigation,
    fallback: '/search?type=route',
  },
  event: {
    kicker: 'details.event',
    icon: CalendarDays,
    fallback: '/search?type=event',
  },
} satisfies Record<SearchItemType, { kicker: string; icon: typeof Wrench; fallback: string }>;

const routeImportant: LocalizedText[] = [
  { ru: 'Маршрут пока демонстрационный: точки и дорожные нюансы будут уточняться перед запуском реальных рекомендаций.', en: 'This is a demo route: points and road details will be checked before real recommendations launch.' },
  { ru: 'Перед поездкой проверь погоду, запас топлива и состояние мотоцикла.', en: 'Before riding, check weather, fuel range and motorcycle condition.' },
];

const placeImportant: LocalizedText[] = [
  { ru: 'Карточка показывает формат будущего проверенного места. Реальные адреса добавим только после проверки.', en: 'This card shows the future verified place format. Real addresses will be added only after checking.' },
  { ru: 'Перед визитом лучше уточнить время работы и возможность принять мотоцикл.', en: 'Before visiting, check opening hours and whether they can take your motorcycle.' },
];

const eventImportant: LocalizedText[] = [
  { ru: 'Событие пока демо: в реальной версии здесь будут точное время, место и организатор.', en: 'This is a demo event: the real version will include exact time, place and organizer.' },
  { ru: 'Если едешь первый раз, приезжай заранее и не стесняйся спросить, где безопасно поставить мотоцикл.', en: 'If it is your first time, arrive early and ask where it is safe to park the motorcycle.' },
];

function getTypeFromPath(pathname: string): SearchItemType {
  if (pathname.startsWith('/route/')) return 'route';
  if (pathname.startsWith('/event/')) return 'event';
  return 'place';
}

export function SearchItemDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const favorites = useFavorites();
  const { language, t } = useI18n();
  const type = getTypeFromPath(location.pathname);
  const item = findSearchItem(type, id);
  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : undefined;

  function goBack() {
    navigate(from || (item ? `/search?type=${item.type}` : '/search'));
  }

  if (!item) {
    return (
      <section className="motohub-screen simple-screen detail-screen">
        <button className="back-link detail-back-button" type="button" onClick={() => navigate('/search')}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t('details.home')}
        </button>
        <section className="empty-state">
          <div><MapPin size={30} aria-hidden="true" /></div>
          <h2>{t('details.notFoundTitle')}</h2>
          <p>{t('details.notFoundText')}</p>
          <Link className="profile-primary-action" to="/search">{t('details.home')}</Link>
        </section>
      </section>
    );
  }

  const title = getLocalizedText(item.title, language);
  const description = getLocalizedText(item.description, language);
  const meta = typeMeta[item.type];
  const Icon = meta.icon;
  const isFavorite = favorites.some((favorite) => favorite.id === item.id && favorite.type === item.type);
  const important = item.type === 'route' ? routeImportant : item.type === 'event' ? eventImportant : placeImportant;

  return (
    <section className="motohub-screen simple-screen detail-screen">
      <button className="back-link detail-back-button" type="button" onClick={goBack}>
        <ArrowLeft size={18} aria-hidden="true" />
        {t('details.back')}
      </button>

      <article className="detail-hero-card">
        {item.image ? <img src={item.image} alt="" /> : null}
        <div className="detail-hero-card__shade" />
        <div className="detail-hero-card__content">
          <span className="detail-kicker"><Icon size={15} /> {t(meta.kicker)}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="detail-badge-row">
            <span><ShieldCheck size={14} /> {item.verified ? t('search.verified') : t('search.notVerified')}</span>
            {item.demo ? <span>{t('details.demo')}</span> : null}
          </div>
        </div>
      </article>

      <div className="detail-action-row">
        <button
          type="button"
          className={isFavorite ? 'is-active' : ''}
          onClick={() => {
            const added = toggleFavorite({ id: item.id, type: item.type, title, description });
            showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
          }}
        >
          <Heart size={18} />
          {isFavorite ? t('details.favoriteRemove') : t('details.favoriteAdd')}
        </button>
        <button type="button" disabled>
          <ExternalLink size={18} />
          {t('details.routePreparing')}
        </button>
      </div>

      {item.meta ? (
        <section className="detail-info-grid">
          {item.meta.distance ? <div><span>{t('details.distance')}</span><strong>{getLocalizedText(item.meta.distance, language)}</strong></div> : null}
          {item.meta.duration ? <div><span>{t('details.duration')}</span><strong>{getLocalizedText(item.meta.duration, language)}</strong></div> : null}
          {item.meta.difficulty ? <div><span>{t('details.difficulty')}</span><strong>{getLocalizedText(item.meta.difficulty, language)}</strong></div> : null}
          {item.meta.date ? <div><span>{t('details.date')}</span><strong>{getLocalizedText(item.meta.date, language)}</strong></div> : null}
          {item.meta.place ? <div><span>{t('details.place')}</span><strong>{getLocalizedText(item.meta.place, language)}</strong></div> : null}
          {item.meta.organizer ? <div><span>{t('details.organizer')}</span><strong>{getLocalizedText(item.meta.organizer, language)}</strong></div> : null}
          {item.details?.surface ? <div><span>{t('details.surface')}</span><strong>{getLocalizedText(item.details.surface, language)}</strong></div> : null}
          {item.details?.suitableFor ? <div><span>{t('details.suitableFor')}</span><strong>{getLocalizedText(item.details.suitableFor, language)}</strong></div> : null}
        </section>
      ) : null}

      <section className="detail-block">
        <span>{t('details.category')}</span>
        <h2>{t(categoryLabelById[item.category])}</h2>
        {item.services?.length ? (
          <div className="chip-list">
            {item.services.map((service) => <span key={service.ru}>{getLocalizedText(service, language)}</span>)}
          </div>
        ) : null}
      </section>

      <section className="detail-block">
        <span>{t('details.important')}</span>
        <div className="detail-list">
          {important.map((line) => (
            <p key={line.ru}><CheckCircle2 size={16} /> {getLocalizedText(line, language)}</p>
          ))}
        </div>
      </section>

      {item.details?.routePoints?.length ? (
        <section className="detail-block">
          <span>{t('details.routePoints')}</span>
          <div className="detail-list">
            {item.details.routePoints.map((line) => (
              <p key={line.ru}><MapPin size={16} /> {getLocalizedText(line, language)}</p>
            ))}
          </div>
        </section>
      ) : null}

      {item.details?.stops?.length ? (
        <section className="detail-block">
          <span>{t('details.stops')}</span>
          <div className="detail-list">
            {item.details.stops.map((line) => (
              <p key={line.ru}><CheckCircle2 size={16} /> {getLocalizedText(line, language)}</p>
            ))}
          </div>
        </section>
      ) : null}

      {item.details?.warnings?.length ? (
        <section className="detail-block">
          <span>{t('details.warnings')}</span>
          <div className="detail-list">
            {item.details.warnings.map((line) => (
              <p key={line.ru}><ShieldCheck size={16} /> {getLocalizedText(line, language)}</p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="soft-callout detail-mg67-callout">
        <span><Star size={17} /> MG67</span>
        <strong>{t('details.mg67Title')}</strong>
        <p>{t('details.mg67Text')}</p>
      </section>
    </section>
  );
}
