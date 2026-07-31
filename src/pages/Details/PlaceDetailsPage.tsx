import { ArrowLeft, CheckCircle2, ChevronDown, ExternalLink, Heart, MapPin, Phone, Share2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { getPlacePrimaryBranch, productLabels } from '../../data/places';
import type { PlaceItem, PlaceStructuredService } from '../../data/places';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { useBackendContent } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { toggleFavorite, useFavorites } from '../../shared/storage/favoritesStore';
import { supabase } from '../../shared/supabase/client';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';
import { showToast } from '../../shared/ui/toastStore';

function contactHref(type: string, value: string, url?: string) {
  if (url) return url;
  if (type === 'phone') return `tel:${value}`;
  if (type === 'email') return `mailto:${value}`;
  if (type === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  return value;
}

function uniqueItems(items: string[]) {
  return Array.from(new Map(items.filter(Boolean).map((item) => [item.trim().toLowerCase(), item.trim()])).values());
}

function getActuality(status: PlaceItem['verificationStatus']) {
  if (status === 'verified_mg67') return { tone: 'good', label: 'Актуально', source: 'проверено командой МотоГде' };
  if (status === 'confirmed') return { tone: 'good', label: 'Актуально', source: 'подтверждено владельцем' };
  if (status === 'community') return { tone: 'warn', label: 'Стоит уточнить', source: 'подтверждено посетителями' };
  return { tone: 'warn', label: 'Стоит уточнить', source: 'проверяется командой МотоГде' };
}

function getServiceStatus(service: PlaceStructuredService) {
  if (service.availability === 'available') return 'Есть';
  if (service.availability === 'unavailable') return 'Не оказывает';
  return 'Подробности уточняются';
}

export function PlaceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const favorites = useFavorites();
  const { language, t } = useI18n();
  const { user } = useUserRoles();
  const backendContent = useBackendContent();
  const place = id ? backendContent.places.find((item) => item.id === id) : undefined;
  const [visitBusy, setVisitBusy] = useState(false);
  const [visitNotice, setVisitNotice] = useState('');
  const [showAllOfferings, setShowAllOfferings] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!place && !backendContent.loading) return <Navigate to="/sections/places" replace />;
  if (!place) {
    return (
      <section className="motohub-screen simple-screen">
        <section className="empty-state"><h2>Загружаем карточку</h2><p>Секунду.</p></section>
      </section>
    );
  }

  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/sections/places';
  const title = getLocalizedText(place.name, language);
  const description = getLocalizedText(place.shortDescription, language);
  const fullDescription = getLocalizedText(place.fullDescription, language).trim();
  const category = appCategories.find((item) => item.id === place.categoryId);
  const categoryTitle = category ? getLocalizedText(category.title, language) : 'Место';
  const primaryBranch = getPlacePrimaryBranch(place);
  const phoneContact = place.contacts.find((contact) => contact.type === 'phone');
  const websiteContact = place.contacts.find((contact) => contact.type === 'website');
  const phone = primaryBranch?.phone ?? phoneContact?.value;
  const routeUrl = primaryBranch?.mapUrl ?? place.mapUrl;
  const isFavorite = favorites.some((favorite) => favorite.id === place.id && favorite.type === 'place');
  const structuredServices = place.structuredServices ?? [];
  const offeringLabels = uniqueItems([
    ...(place.products ?? []).map((chip) => getLocalizedText(productLabels[chip] ?? { ru: chip, en: chip }, language)),
    ...(place.features ?? []).map((chip) => getLocalizedText(productLabels[chip] ?? { ru: chip, en: chip }, language)),
    ...(place.services?.map((service) => getLocalizedText(service, language)) ?? []),
  ]);
  const hasUsefulOfferings = place.id !== 'rolling-moto-shop-smolensk' && offeringLabels.length > 0;
  const visibleOfferings = showAllOfferings ? offeringLabels : offeringLabels.slice(0, 5);
  const actuality = getActuality(place.verificationStatus);
  const relatedGuides: { label: { ru: string; en: string }; to: string }[] = [];

  async function sharePlace() {
    const currentPlace = place!;
    const url = `${window.location.origin}/place/${currentPlace.id}`;
    if (navigator.share) {
      await navigator.share({ title, text: description, url });
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована');
    }
  }

  async function submitVisitReport(isOpen: boolean | null) {
    if (!supabase || !user) return;
    const currentPlace = place!;
    setVisitBusy(true);
    setVisitNotice('');
    const { error } = await supabase.from('visit_reports').insert({
      user_id: user.id,
      place_id: currentPlace.id,
      region_id: currentPlace.regionId,
      visited_at: new Date().toISOString(),
      is_open: isOpen,
      services_confirmed: structuredServices.map((service) => service.id),
    });
    setVisitBusy(false);
    if (error) {
      setVisitNotice('Не удалось отправить сигнал. Возможно, по этому месту уже был сигнал за последние 24 часа.');
      return;
    }
    setVisitNotice('Спасибо. Сигнал отправлен на модерацию.');
    showToast('Спасибо, сигнал отправлен');
  }

  function handleVisitAction(isOpen: boolean) {
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    void submitVisitReport(isOpen);
  }

  return (
    <section className="motohub-screen simple-screen detail-screen place-detail-screen">
      <button className="back-link detail-back-button" type="button" onClick={() => navigate(from)}>
        <ArrowLeft size={18} aria-hidden="true" />
        {t('details.back')}
      </button>

      <div className="place-detail-layout">
        <article className="place-detail-main">
          <section className="detail-hero-card place-hero-card">
            <ImageWithFallback src={place.coverImage ?? place.image} alt={title} />
          </section>

          <section className="place-summary-card">
            <div>
              <span className="place-category-label">{categoryTitle}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
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
          </section>

          <section className="place-status-row">
            <span className={`actuality-pill actuality-pill--${actuality.tone}`}>
              <ShieldCheck size={14} aria-hidden="true" />
              {actuality.label}{place.informationCheckedAt ? ` · проверено ${place.informationCheckedAt}` : ''}
            </span>
            <small>{actuality.source}</small>
          </section>

          <section className="detail-info-grid place-info-compact">
            {primaryBranch?.address ? <div><span>{t('places.address')}</span><strong>{getLocalizedText(primaryBranch.address, language)}</strong></div> : null}
            {primaryBranch?.schedule ? <div><span>{t('places.schedule')}</span><strong>{getLocalizedText(primaryBranch.schedule, language)}</strong></div> : null}
            {phone ? <div><span>{t('places.phone')}</span><strong>{phone}</strong></div> : null}
          </section>

          <section className="place-action-panel">
            {phone ? <a href={`tel:${phone}`}><Phone size={18} /> {t('places.call')}</a> : null}
            {routeUrl ? <a href={routeUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> {t('places.route')}</a> : null}
            <button type="button" onClick={() => void sharePlace()}><Share2 size={18} /> Поделиться</button>
          </section>

          {websiteContact ? (
            <div className="place-secondary-links">
              <a href={contactHref(websiteContact.type, websiteContact.value, websiteContact.url)} target="_blank" rel="noreferrer">
                Открыть сайт
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            </div>
          ) : null}

          {fullDescription ? (
            <section className="detail-block place-about-block">
              <span>{t('places.about')}</span>
              <div className="place-description">
                {fullDescription.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ) : null}

          {hasUsefulOfferings ? (
            <section className="detail-block">
              <span>Товары и услуги</span>
              <div className="chip-list">
                {visibleOfferings.map((chip) => <span key={chip}>{chip}</span>)}
              </div>
              {offeringLabels.length > 5 ? (
                <button className="inline-more-button" type="button" onClick={() => setShowAllOfferings((value) => !value)}>
                  {showAllOfferings ? 'Скрыть' : 'Показать всё'}
                </button>
              ) : null}
            </section>
          ) : null}

          {structuredServices.length ? (
            <section className="detail-block">
              <span>Услуги</span>
              <div className="structured-service-list">
                {structuredServices.map((service) => (
                  <div key={service.id}>
                    <strong>{getLocalizedText(service.title, language)}</strong>
                    <small>{getServiceStatus(service)}</small>
                  </div>
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

          {relatedGuides.length ? (
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
          ) : null}

          <section className="soft-callout visit-report-card">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <strong>Были здесь недавно?</strong>
              <p>Помогите проверить актуальность информации.</p>
              <span className="admin-action-row visit-action-row">
                <button type="button" disabled={visitBusy} onClick={() => handleVisitAction(true)}>Всё актуально</button>
                <button type="button" disabled={visitBusy} onClick={() => handleVisitAction(false)}>Есть неточность</button>
              </span>
              {visitNotice ? <small>{visitNotice}</small> : null}
            </div>
          </section>

          <section className="detail-disclosure">
            <button type="button" onClick={() => setHelpOpen((value) => !value)}>
              Помочь улучшить карточку
              <ChevronDown size={17} aria-hidden="true" />
            </button>
            {helpOpen ? (
              <div className="place-bottom-actions">
                <Link to={`/feedback?category=correction&sourceType=place&sourceId=${place.id}&sourceTitle=${encodeURIComponent(title)}`}>{t('places.reportError')}</Link>
                <Link to={`/feedback?category=idea&sourceType=place&sourceId=${place.id}&sourceTitle=${encodeURIComponent(title)}`}>{t('places.suggestCorrection')}</Link>
                <Link to={`/profile/claims?placeId=${place.id}`}>Заявить права</Link>
              </div>
            ) : null}
          </section>
        </article>
      </div>
    </section>
  );
}
