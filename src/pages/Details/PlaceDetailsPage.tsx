import { ArrowLeft, CheckCircle2, ChevronDown, ExternalLink, Globe2, Heart, MapPin, Navigation, Phone, Share2, ShieldCheck } from 'lucide-react';
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
  if (status === 'verified_mg67') return { tone: 'good', label: 'Проверено', source: 'проверено командой МотоГде' };
  if (status === 'confirmed') return { tone: 'good', label: 'Проверено', source: 'подтверждено владельцем' };
  if (status === 'community') return { tone: 'warn', label: 'Есть сигналы', source: 'подтверждено посетителями' };
  return { tone: 'warn', label: 'Уточняется', source: 'проверяется командой МотоГде' };
}

function getServiceStatus(service: PlaceStructuredService) {
  if (service.availability === 'available') return 'Есть';
  if (service.availability === 'unavailable') return 'Не оказывает';
  return 'Уточняется';
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
      <section className="motohub-screen simple-screen public-ui-v2">
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
  const websiteUrl = websiteContact ? contactHref(websiteContact.type, websiteContact.value, websiteContact.url) : '';
  const isFavorite = favorites.some((favorite) => favorite.id === place.id && favorite.type === 'place');
  const structuredServices = place.structuredServices ?? [];
  const offeringLabels = uniqueItems([
    ...(place.products ?? []).map((chip) => getLocalizedText(productLabels[chip] ?? { ru: chip, en: chip }, language)),
    ...(place.features ?? []).map((chip) => getLocalizedText(productLabels[chip] ?? { ru: chip, en: chip }, language)),
    ...(place.services?.map((service) => getLocalizedText(service, language)) ?? []),
  ]);
  const visibleOfferings = showAllOfferings ? offeringLabels : offeringLabels.slice(0, 8);
  const actuality = getActuality(place.verificationStatus);
  const address = primaryBranch?.address ? getLocalizedText(primaryBranch.address, language) : 'Смоленск и область';
  const schedule = primaryBranch?.schedule ? getLocalizedText(primaryBranch.schedule, language) : 'График лучше уточнить';

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
    const currentPlace = place!;
    if (!supabase || !user) return;
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
    <section className="motohub-screen simple-screen detail-screen place-detail-screen public-ui-v2 public-place-screen">
      <article className="place-detail-main public-place-card">
        <section className="detail-hero-card place-hero-card public-place-photo">
          <ImageWithFallback src={place.coverImage ?? place.image} alt={title} />
          <div className="place-hero-actions">
            <button type="button" onClick={() => navigate(from)} aria-label={t('details.back')}><ArrowLeft size={20} aria-hidden="true" /></button>
            <span>
              <button
                type="button"
                className={isFavorite ? 'is-active' : ''}
                aria-label={t('home.favoriteAdd')}
                onClick={() => {
                  const added = toggleFavorite({ id: place.id, type: 'place', title, description });
                  showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
                }}
              >
                <Heart size={19} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => void sharePlace()} aria-label="Поделиться"><Share2 size={19} aria-hidden="true" /></button>
            </span>
          </div>
        </section>

        <section className="place-summary-card public-place-summary">
          <div>
            <div className="place-title-row">
              <h1>{title}</h1>
              <span className={`actuality-pill actuality-pill--${actuality.tone}`}><ShieldCheck size={14} aria-hidden="true" />{actuality.label}</span>
            </div>
            <p>{categoryTitle}</p>
          </div>
        </section>

        <section className="place-primary-actions">
          {phone ? <a href={`tel:${phone}`}><Phone size={20} aria-hidden="true" />Позвонить</a> : <span className="is-disabled"><Phone size={20} aria-hidden="true" />Позвонить</span>}
          {routeUrl ? <a href={routeUrl} target="_blank" rel="noreferrer"><Navigation size={20} aria-hidden="true" />Маршрут</a> : <span className="is-disabled"><Navigation size={20} aria-hidden="true" />Маршрут</span>}
          {websiteUrl ? <a href={websiteUrl} target="_blank" rel="noreferrer"><Globe2 size={20} aria-hidden="true" />Сайт</a> : <span className="is-disabled"><Globe2 size={20} aria-hidden="true" />Сайт</span>}
        </section>

        <section className="place-info-sheet">
          <div><MapPin size={18} aria-hidden="true" /><span><strong>{address}</strong><small>Текущий регион: Смоленск и область</small></span></div>
          <div><ShieldCheck size={18} aria-hidden="true" /><span><strong>{schedule}</strong><small>{actuality.source}</small></span></div>
          {phone ? <div><Phone size={18} aria-hidden="true" /><span><strong>{phone}</strong><small>Перед визитом лучше уточнить детали</small></span></div> : null}
        </section>

        {visibleOfferings.length || structuredServices.length ? (
          <section className="detail-block public-detail-block public-services-block">
            <span>Услуги</span>
            {visibleOfferings.length ? (
              <div className="chip-list public-chip-list">
                {visibleOfferings.map((chip) => <span key={chip}>{chip}</span>)}
              </div>
            ) : null}
            {offeringLabels.length > 8 ? (
              <button className="inline-more-button" type="button" onClick={() => setShowAllOfferings((value) => !value)}>
                {showAllOfferings ? 'Скрыть' : 'Показать всё'}
              </button>
            ) : null}
            {!visibleOfferings.length && structuredServices.length ? (
              <div className="structured-service-list public-structured-services">
                {structuredServices.map((service) => (
                  <div key={service.id}>
                    <strong>{getLocalizedText(service.title, language)}</strong>
                    <small>{getServiceStatus(service)}</small>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {fullDescription ? (
          <section className="detail-block public-detail-block place-about-block">
            <span>О месте</span>
            <div className="place-description">
              {fullDescription.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ) : null}

        {place.mg67Comment ? (
          <section className="soft-callout detail-mg67-callout public-soft-callout">
            <span>МотоГде</span>
            <strong>Комментарий команды МотоГде</strong>
            <p>{getLocalizedText(place.mg67Comment, language)}</p>
          </section>
        ) : null}

        <section className="soft-callout visit-report-card public-soft-callout">
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

        <section className="detail-disclosure public-detail-disclosure">
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
    </section>
  );
}


