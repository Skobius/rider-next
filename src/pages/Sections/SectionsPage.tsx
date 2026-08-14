import { ArrowLeft, CalendarDays, ChevronRight, GraduationCap, HelpCircle, Layers3, Route, ShieldCheck, ShoppingBag, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getCategoryMaterialCountForRegion } from '../../data/categories';
import { events } from '../../data/events';
import { getRegionContentNotice, getRegionContentStatus, getRegionContentStatusText } from '../../data/regions';
import { routes } from '../../data/routes';
import { appSections, findSectionBySlug, getSectionCategories, isRegionalSection } from '../../data/sections';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { useGuestSettings } from '../../shared/storage/guestSettings';
import { getContentIcon } from '../../shared/ui/contentIcons';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';

const sectionGroups = [
  {
    title: 'Места',
    description: 'Куда обратиться рядом: ремонт, резина, магазины и обучение.',
    items: [
      { title: 'Сервисы', description: 'Ремонт, ТО и диагностика', to: '/sections/places/services', icon: Wrench },
      { title: 'Шиномонтаж', description: 'Замена резины и колёса', to: '/sections/places/tire-services', icon: Wrench },
      { title: 'Магазины', description: 'Экипировка, запчасти, расходники', to: '/sections/places/moto-shops', icon: ShoppingBag },
      { title: 'Страховка', description: 'ОСАГО и документы', to: '/sections/places/insurance-documents', icon: ShieldCheck },
      { title: 'Обучение', description: 'Школы, инструкторы и площадки', to: '/sections/places/schools-instructors', icon: GraduationCap },
    ],
  },
  {
    title: 'Поездки',
    description: 'Маршруты и события, когда хочется выбраться.',
    items: [
      { title: 'Маршруты', description: 'Идеи поездок по региону', to: '/sections/routes', icon: Route },
      { title: 'События', description: 'Встречи и активности', to: '/sections/community', icon: CalendarDays },
    ],
  },
  {
    title: 'Полезное',
    description: 'Короткие ответы и спокойное развитие навыков.',
    items: [
      { title: 'Гайды', description: 'Полезно знать без длинных статей', to: '/sections/guides', icon: HelpCircle },
      { title: 'Навыки и безопасность', description: 'Практика, город и уверенность', to: '/sections/skills', icon: ShieldCheck },
    ],
  },
];

function SectionsIndex() {
  const { t } = useI18n();
  const settings = useGuestSettings();
  const regionStatus = getRegionContentStatus(settings.regionId);
  const regionNotice = getRegionContentNotice(regionStatus);

  return (
    <section className="motohub-screen simple-screen sections-screen">
      <Link className="back-link" to="/search">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('search.back')}
      </Link>

      <header className="simple-screen__header">
        <p>МотоГде</p>
        <h1>Разделы</h1>
        <span>Всё полезное для мотоциклиста в одном месте.</span>
      </header>

      {regionNotice ? (
        <section className="soft-callout detail-mg67-callout">
          <span>{getRegionContentStatusText(regionStatus)}</span>
          <p>{regionNotice}</p>
        </section>
      ) : null}

      <div className="sections-directory">
        {sectionGroups.map((group) => (
          <section className="sections-directory-group" key={group.title}>
            <header>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </header>
            <div className="sections-directory-list">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link className="section-directory-row" to={item.to} key={item.to}>
                    <span><Icon size={19} aria-hidden="true" /></span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function SectionDetail({ slug }: { slug: string }) {
  const section = findSectionBySlug(slug);
  const { language, t } = useI18n();
  const settings = useGuestSettings();

  if (!section) return <Navigate to="/sections" replace />;

  const Icon = getContentIcon(section.icon);
  const categories = getSectionCategories(section);
  const regionStatus = getRegionContentStatus(settings.regionId);
  const regionNotice = isRegionalSection(section) ? getRegionContentNotice(regionStatus) : '';

  const sectionCatalog = section.id === 'community'
    ? <EventsCalendar regionId={settings.regionId} />
    : section.id === 'routes'
      ? <RoutesShowcase regionId={settings.regionId} />
      : null;

  return (
    <section className="motohub-screen simple-screen section-detail-screen">
      <Link className="back-link" to="/sections">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('sections.allSections')}
      </Link>

      <header className="section-hero-card">
        <ImageWithFallback src={section.image} alt={getLocalizedText(section.title, language)} />
        <div className="section-hero-card__shade" />
        <div className="section-hero-card__content">
          <span><Icon size={18} /> {t('sections.kicker')}</span>
          <h1>{getLocalizedText(section.title, language)}</h1>
          <p>{getLocalizedText(section.description, language)}</p>
        </div>
      </header>

      <section className="motohub-section">
        {regionNotice ? (
          <section className="soft-callout detail-mg67-callout">
            <span>{getRegionContentStatusText(regionStatus)}</span>
            <p>{regionNotice}</p>
          </section>
        ) : null}

        <div className="section-heading-row">
          <h2>{t('sections.categoriesTitle')}</h2>
          <span className="section-muted-count">{categories.length} {t('sections.categories')}</span>
        </div>

        {sectionCatalog ?? <div className="task-grid category-grid">
          {categories.map((category) => {
            const CategoryIcon = getContentIcon(category.icon);
            const itemCount = isRegionalSection(section) ? getCategoryMaterialCountForRegion(category, settings.regionId) : category.entityIds.length;

            return (
              <Link className="task-card category-card" to={`/sections/${section.slug}/${category.slug}`} key={category.id}>
                <ImageWithFallback src={category.image} alt={getLocalizedText(category.title, language)} />
                <span><CategoryIcon size={20} /></span>
                <strong>{getLocalizedText(category.title, language)}</strong>
                <small>{getLocalizedText(category.description, language)}</small>
                <em>{itemCount} {t('sections.materials')}</em>
              </Link>
            );
          })}
        </div>}
      </section>

      <section className="empty-state compact-empty-state section-step-note">
        <div><Layers3 size={24} /></div>
        <h2>{t('sections.catalogReadyTitle')}</h2>
        <p>{t('sections.catalogReadyText')}</p>
      </section>
    </section>
  );
}

const monthNames = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function EventsCalendar({ regionId }: { regionId: string }) {
  const { language } = useI18n();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const availableYears = [2026, 2027];
  const defaultYear = availableYears.includes(currentYear) ? currentYear : 2026;
  const [year, setYear] = useState(defaultYear);
  const [openMonth, setOpenMonth] = useState(year === currentYear ? currentMonth : 8);
  const byMonth = useMemo(
    () => monthNames.map((_, index) => events.filter((event) => event.regionId === regionId && event.year === year && event.month === index + 1)),
    [regionId, year],
  );

  return (
    <div className="calendar-stack">
      <div className="calendar-year-switch" role="tablist" aria-label="Год событий">
        {availableYears.map((item) => (
          <button
            type="button"
            className={item === year ? 'is-active' : ''}
            onClick={() => {
              setYear(item);
              setOpenMonth(item === currentYear ? currentMonth : 1);
            }}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="month-list">
        {byMonth.map((monthEvents, index) => {
          const month = index + 1;
          const isOpen = openMonth === month;

          return (
            <section className="month-card" key={month}>
              <button type="button" onClick={() => setOpenMonth(isOpen ? 0 : month)}>
                <span>{monthNames[index]}</span>
                <em>{monthEvents.length ? `${monthEvents.length} событие` : 'Пока событий нет'}</em>
              </button>
              {isOpen ? (
                <div className="month-card__content">
                  {monthEvents.length ? monthEvents.map((event) => (
                    <Link className="catalog-card" to={`/event/${event.id}`} key={event.id}>
                      <span className="catalog-card__media">
                        <ImageWithFallback src={event.image} alt={getLocalizedText(event.title, language)} />
                      </span>
                      <span className="catalog-card__copy">
                        <b><CalendarDays size={13} /> {event.meta?.date ? getLocalizedText(event.meta.date, language) : monthNames[index]}</b>
                        <strong>{getLocalizedText(event.title, language)}</strong>
                        <small>{getLocalizedText(event.description, language)}</small>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </Link>
                  )) : <p className="month-empty">Событий пока нет.</p>}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function RoutesShowcase({ regionId }: { regionId: string }) {
  const { language } = useI18n();
  const filteredRoutes = routes.filter((route) => route.regionId === regionId);

  return (
    <div className="catalog-card-list">
      {filteredRoutes.length ? filteredRoutes.map((route) => (
        <Link className="catalog-card" to={`/route/${route.id}`} key={route.id}>
          <span className="catalog-card__media">
            <ImageWithFallback src={route.image} alt={getLocalizedText(route.title, language)} />
          </span>
          <span className="catalog-card__copy">
            <b>{route.meta?.duration ? getLocalizedText(route.meta.duration, language) : 'Маршрут'}</b>
            <strong>{getLocalizedText(route.title, language)}</strong>
            <small>{getLocalizedText(route.description, language)}</small>
            {route.meta?.distance ? <em>{getLocalizedText(route.meta.distance, language)}</em> : null}
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      )) : (
        <section className="empty-state compact-empty-state">
          <div><Layers3 size={24} /></div>
          <h2>Проверенные маршруты для этого региона пока не добавлены.</h2>
        </section>
      )}
    </div>
  );
}

export function SectionsPage() {
  const { slug } = useParams();
  return slug ? <SectionDetail slug={slug} /> : <SectionsIndex />;
}
