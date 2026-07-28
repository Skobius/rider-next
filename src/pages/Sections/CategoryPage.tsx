import { ArrowLeft, ChevronRight, Layers3, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { appCategories, getCategoryMaterialCountForRegion } from '../../data/categories';
import { events } from '../../data/events';
import { guides } from '../../data/guides';
import { places } from '../../data/places';
import { routes } from '../../data/routes';
import { searchContent } from '../../data/searchContent';
import { findSectionBySlug, isRegionalSection } from '../../data/sections';
import { skills } from '../../data/skills';
import { getLocalizedText, type LocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { useGuestSettings } from '../../shared/storage/guestSettings';
import { getContentIcon } from '../../shared/ui/contentIcons';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';
import { PlaceCard } from '../../shared/ui/PlaceCard';

interface CatalogEntity {
  id: string;
  path: string;
  title: LocalizedText;
  description: LocalizedText;
  image?: string;
  badge?: LocalizedText;
  meta?: LocalizedText;
}

const allSearchItems = [...searchContent, ...places, ...routes, ...events];

function isPresent<T>(item: T | undefined): item is T {
  return Boolean(item);
}

function getCatalogEntities(categoryId: string, entityIds: string[], entityType: string, regionId: string): CatalogEntity[] {
  if (entityType === 'guide') {
    return entityIds
      .map((id) => guides.find((guide) => guide.id === id))
      .filter(isPresent)
      .map((guide) => ({
        id: guide.id,
        path: `/guides/${guide.slug}`,
        title: guide.cardTitle ?? guide.title,
        description: guide.shortDescription,
        image: guide.image,
        badge: guide.status === 'published' ? { ru: 'Материал проверен', en: 'Material reviewed' } : { ru: 'Гайд готовится', en: 'Guide in progress' },
      }));
  }

  if (entityType === 'skill') {
    return entityIds
      .map((id) => skills.find((skill) => skill.id === id))
      .filter(isPresent)
      .map((skill) => ({
        id: skill.id,
        path: `/skill/${skill.id}`,
        title: skill.title,
        description: skill.description,
        image: skill.image,
        badge: skill.badge,
      }));
  }

  return entityIds
    .map((id) => allSearchItems.find((item) => item.id === id && item.type === entityType))
    .filter(isPresent)
    .filter((item) => !('regionId' in item) || item.regionId === regionId)
    .map((item) => {
      const badge: LocalizedText | undefined = 'badge' in item
        ? item.badge as LocalizedText
        : item.demo
          ? { ru: 'Информация уточняется', en: 'Info is being checked' }
          : undefined;

      return {
        id: item.id,
        path: item.type === 'route' ? `/route/${item.id}` : item.type === 'event' ? `/event/${item.id}` : `/place/${item.id}`,
        title: item.title,
        description: item.description,
        image: item.image,
        badge,
        meta: item.meta?.duration ?? item.meta?.date,
      };
    });
}

function getRegionalEmptyText(entityType: string) {
  if (entityType === 'route') return 'Проверенные маршруты для этого региона пока не добавлены.';
  if (entityType === 'event') return 'Событий пока нет.';
  return 'В этой категории пока нет проверенных мест для выбранного региона.';
}

export function CategoryPage() {
  const { sectionSlug, categorySlug } = useParams();
  const section = findSectionBySlug(sectionSlug);
  const settings = useGuestSettings();
  const { language, t } = useI18n();

  if (!section) return <Navigate to="/sections" replace />;

  const category = appCategories.find((item) => item.sectionId === section.id && item.slug === categorySlug);
  if (!category) return <Navigate to={`/sections/${section.slug}`} replace />;

  const Icon = getContentIcon(category.icon);
  const entities = getCatalogEntities(category.id, category.entityIds, category.entityType, settings.regionId);
  const materialCount = isRegionalSection(section) ? getCategoryMaterialCountForRegion(category, settings.regionId) : category.entityIds.length;
  const relatedCategories = appCategories.filter((item) => item.sectionId === section.id && item.id !== category.id).slice(0, 4);

  return (
    <section className="motohub-screen simple-screen category-screen">
      <Link className="back-link" to={`/sections/${section.slug}`}>
        <ArrowLeft size={18} aria-hidden="true" />
        {getLocalizedText(section.title, language)}
      </Link>

      <header className="section-hero-card category-hero-card">
        <ImageWithFallback src={category.image} alt={getLocalizedText(category.title, language)} />
        <div className="section-hero-card__shade" />
        <div className="section-hero-card__content">
          <span><Icon size={18} /> {t('sections.category')}</span>
          <h1>{getLocalizedText(category.title, language)}</h1>
          <p>{getLocalizedText(category.description, language)}</p>
          <div className="detail-badge-row">
            <span><Layers3 size={14} /> {materialCount} {t('sections.materials')}</span>
            {category.status === 'placeholder' ? <span>{t('sections.infoChecking')}</span> : null}
          </div>
        </div>
      </header>

      {entities.length ? (
        <section className="motohub-section">
          <div className="section-heading-row">
            <h2>{t('sections.categoryItems')}</h2>
            <span className="section-muted-count">{entities.length}</span>
          </div>

          <div className="catalog-card-list">
            {category.entityType === 'place'
              ? category.entityIds
                .map((id) => places.find((place) => place.id === id))
                .filter(isPresent)
                .filter((place) => place.regionId === settings.regionId)
                .map((place) => <PlaceCard place={place} from={`/sections/${section.slug}/${category.slug}`} key={place.id} />)
              : entities.map((entity) => (
                <Link className="catalog-card" to={entity.path} state={{ from: `/sections/${section.slug}/${category.slug}` }} key={entity.id}>
                  <span className="catalog-card__media">
                    <ImageWithFallback src={entity.image} alt={getLocalizedText(entity.title, language)} />
                  </span>
                  <span className="catalog-card__copy">
                    {entity.badge ? <b><ShieldCheck size={13} /> {getLocalizedText(entity.badge, language)}</b> : null}
                    <strong>{getLocalizedText(entity.title, language)}</strong>
                    <small>{getLocalizedText(entity.description, language)}</small>
                    {entity.meta ? <em>{getLocalizedText(entity.meta, language)}</em> : null}
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              ))}
          </div>
        </section>
      ) : (
        <section className="empty-state compact-empty-state">
          <div><Layers3 size={24} /></div>
          <h2>{t('sections.emptyCategoryTitle')}</h2>
          <p>{isRegionalSection(section) ? getRegionalEmptyText(category.entityType) : t('sections.emptyCategoryText')}</p>
        </section>
      )}

      <section className="motohub-section">
        <h2>{t('sections.relatedCategories')}</h2>
        <div className="related-category-list">
          {relatedCategories.map((item) => {
            const RelatedIcon = getContentIcon(item.icon);
            return (
              <Link to={`/sections/${section.slug}/${item.slug}`} key={item.id}>
                <span><RelatedIcon size={16} /></span>
                <strong>{getLocalizedText(item.title, language)}</strong>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <Link className="profile-primary-action profile-secondary-action" to={`/feedback?category=${category.id}`}>
        {t('sections.suggestInfo')}
      </Link>
    </section>
  );
}
