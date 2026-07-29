import { AlertTriangle, ArrowLeft, ExternalLink, Heart, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { getPlacePrimaryBranch, productLabels, verificationLabels } from '../../data/places';
import { useBackendContent } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { toggleFavorite, useFavorites } from '../../shared/storage/favoritesStore';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';
import { showToast } from '../../shared/ui/toastStore';

function contactHref(type: string, value: string, url?: string) {
  if (url) return url;
  if (type === 'phone') return `tel:${value}`;
  if (type === 'email') return `mailto:${value}`;
  if (type === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  return value;
}

export function PlaceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const favorites = useFavorites();
  const { language, t } = useI18n();
  const backendContent = useBackendContent();
  const place = id ? backendContent.places.find((item) => item.id === id) : undefined;

  if (!place && !backendContent.loading) return <Navigate to="/sections/places" replace />;
  if (!place) return <section className="motohub-screen simple-screen"><section className="empty-state"><h2>Загружаем карточку</h2><p>Секунду.</p></section></section>;

  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/sections/places';
  const title = getLocalizedText(place.name, language);
  const description = getLocalizedText(place.shortDescription, language);
  const category = appCategories.find((item) => item.id === place.categoryId);
  const primaryBranch = getPlacePrimaryBranch(place);
  const phoneContact = place.contacts.find((contact) => contact.type === 'phone');
  const canCall = Boolean(primaryBranch?.phone || phoneContact?.value);
  const canRoute = Boolean(primaryBranch?.mapUrl);
  const isFavorite = favorites.some((favorite) => favorite.id === place.id && favorite.type === 'place');
  const chips = [...(place.products ?? []), ...(place.services?.map((service) => service.ru) ?? []), ...(place.features ?? [])];
  const relatedGuides = [
    { label: { ru: 'Давление в шинах', en: 'Tire pressure' }, to: '/guides/motorcycle-tire-pressure' },
    { label: { ru: 'Уход за цепью', en: 'Chain care' }, to: '/guides/motorcycle-chain-care' },
    { label: { ru: 'Когда менять масло', en: 'When to change your oil' }, to: '/guides/when-to-change-motorcycle-oil' },
    { label: { ru: 'После зимы', en: 'After winter storage' }, to: '/guides/motorcycle-check-after-winter' },
  ];

  return (
    <section className="motohub-screen simple-screen detail-screen place-detail-screen">
      <button className="back-link detail-back-button" type="button" onClick={() => navigate(from)}>
        <ArrowLeft size={18} aria-hidden="true" />
        {t('details.back')}
      </button>

      <article className="detail-hero-card place-hero-card">
        <ImageWithFallback src={place.coverImage ?? place.image} alt={title} />
        <div className="detail-hero-card__shade" />
        <button
          type="button"
          className={`place-favorite-button ${isFavorite ? 'is-active' : ''}`}
          aria-label={t('home.favoriteAdd')}
          onClick={() => {
            const added = toggleFavorite({ id: place.id, type: 'place', title, description });
            showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
          }}
        >
          <Heart size={18} aria-hidden="true" />
        </button>
        <div className="detail-hero-card__content">
          <span className={`detail-kicker status-${place.verificationStatus}`}>
            <ShieldCheck size={15} />
            {getLocalizedText(verificationLabels[place.verificationStatus], language)}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
          {category ? <div className="detail-badge-row"><span>{getLocalizedText(category.title, language)}</span></div> : null}
        </div>
      </article>

      <div className="place-action-row">
        {canCall ? (
          <a href={`tel:${primaryBranch?.phone ?? phoneContact?.value}`}><Phone size={18} /> {t('places.call')}</a>
        ) : null}
        {canRoute && primaryBranch?.mapUrl ? (
          <a href={primaryBranch.mapUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> {t('places.route')}</a>
        ) : null}
      </div>

      {place.verificationStatus === 'pending' ? (
        <section className="soft-callout place-warning-callout">
          <span><AlertTriangle size={17} /> {t('places.confirmAddress')}</span>
          <p>{getLocalizedText(place.verificationNote ?? verificationLabels.pending, language)}</p>
        </section>
      ) : null}

      <section className="detail-info-grid">
        {primaryBranch?.address ? <div><span>{t('places.address')}</span><strong>{getLocalizedText(primaryBranch.address, language)}</strong></div> : null}
        {primaryBranch?.schedule ? <div><span>{t('places.schedule')}</span><strong>{getLocalizedText(primaryBranch.schedule, language)}</strong></div> : null}
        {primaryBranch?.phone ? <div><span>{t('places.phone')}</span><strong><a href={`tel:${primaryBranch.phone}`}>{primaryBranch.phone}</a></strong></div> : null}
        <div><span>{t('places.statusActuality')}</span><strong>{place.informationCheckedAt ? `${t('places.checkedAt')} ${place.informationCheckedAt}` : t('places.infoBeforeVisit')}</strong></div>
        {place.branches.length > 1 ? <div><span>{t('places.branches')}</span><strong>{place.branches.length}</strong></div> : null}
      </section>

      <section className="detail-block">
        <span>{t('places.about')}</span>
        <div className="place-description">
          {getLocalizedText(place.fullDescription, language).split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      {chips.length ? (
        <section className="detail-block">
          <span>{t('places.availableHere')}</span>
          <div className="chip-list">
            {chips.map((chip) => (
              <span key={chip}>{getLocalizedText(productLabels[chip] ?? { ru: chip, en: chip }, language)}</span>
            ))}
          </div>
        </section>
      ) : null}

      {place.contacts.length ? (
        <section className="detail-block">
          <span>{t('places.contacts')}</span>
          <div className="contact-list">
            {place.contacts.map((contact) => (
              <a href={contactHref(contact.type, contact.value, contact.url)} target={contact.type === 'phone' || contact.type === 'email' ? undefined : '_blank'} rel="noreferrer" key={`${contact.type}-${contact.value}`}>
                <strong>{contact.label ? getLocalizedText(contact.label, language) : contact.value}</strong>
                <small>{contact.type}</small>
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {place.mg67Comment ? (
        <section className="soft-callout detail-mg67-callout">
          <span>MG67</span>
          <strong>{t('places.mg67Comment')}</strong>
          <p>{getLocalizedText(place.mg67Comment, language)}</p>
        </section>
      ) : null}

      {place.branches.length > 1 ? (
        <section className="detail-block">
          <span>{t('places.branches')}</span>
          <div className="branch-list">
            {place.branches.map((branch) => (
              <div key={branch.id}>
                <strong>{branch.title ? getLocalizedText(branch.title, language) : getLocalizedText(branch.address, language)}</strong>
                {branch.schedule ? <small>{getLocalizedText(branch.schedule, language)}</small> : null}
                <span>
                  {branch.phone ? <a href={`tel:${branch.phone}`}>{t('places.call')}</a> : null}
                  {branch.mapUrl ? <a href={branch.mapUrl} target="_blank" rel="noreferrer">{t('places.route')}</a> : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="detail-block">
        <span>{t('guides.relatedMaterials')}</span>
        <div className="related-category-list">
          {relatedGuides.map((guide) => (
            <Link to={guide.to} key={guide.to}>
              <strong>{getLocalizedText(guide.label, language)}</strong>
              <ExternalLink size={15} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className="place-bottom-actions">
        <Link to={`/feedback?category=correction&sourceType=place&sourceId=${place.id}&sourceTitle=${encodeURIComponent(title)}`}>{t('places.reportError')}</Link>
        <Link to={`/feedback?category=idea&sourceType=place&sourceId=${place.id}&sourceTitle=${encodeURIComponent(title)}`}>{t('places.suggestCorrection')}</Link>
      </div>
    </section>
  );
}
