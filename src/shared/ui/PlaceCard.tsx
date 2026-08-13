import { Heart, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { getPlacePrimaryBranch, type PlaceItem } from '../../data/places';
import { getLocalizedText } from '../i18n/localizedText';
import { useI18n } from '../i18n/useI18n';
import { toggleFavorite, useFavorites } from '../storage/favoritesStore';
import { ImageWithFallback } from './ImageWithFallback';
import { showToast } from './toastStore';

interface PlaceCardProps {
  place: PlaceItem;
  from?: string;
}

function getActualityLabel(place: PlaceItem) {
  if (place.verificationStatus === 'verified_mg67' || place.verificationStatus === 'confirmed') return 'Проверено';
  if (place.verificationStatus === 'community') return 'Есть сигналы';
  return 'Уточняется';
}

function contactHref(type: string, value: string, url?: string) {
  if (url) return url;
  if (type === 'phone') return `tel:${value}`;
  if (type === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  return value;
}

export function PlaceCard({ place, from }: PlaceCardProps) {
  const { language, t } = useI18n();
  const favorites = useFavorites();
  const title = getLocalizedText(place.name, language);
  const description = getLocalizedText(place.shortDescription, language);
  const category = appCategories.find((item) => item.id === place.categoryId);
  const categoryTitle = category ? getLocalizedText(category.title, language) : 'Место';
  const branch = getPlacePrimaryBranch(place);
  const address = branch?.address ? getLocalizedText(branch.address, language) : 'Смоленск и область';
  const schedule = branch?.schedule ? getLocalizedText(branch.schedule, language) : 'График уточняется';
  const phoneContact = place.contacts.find((contact) => contact.type === 'phone');
  const phone = branch?.phone ?? phoneContact?.value;
  const routeUrl = branch?.mapUrl ?? place.mapUrl;
  const isFavorite = favorites.some((favorite) => favorite.id === place.id && favorite.type === 'place');
  const state = from ? { from } : undefined;

  return (
    <article className="place-list-card">
      <Link className="place-list-card__content" to={`/place/${place.id}`} state={state}>
        <span className="place-list-card__media">
          <ImageWithFallback src={place.coverImage ?? place.image} alt={title} />
        </span>
        <span className="place-list-card__body">
          <span className="place-list-card__eyebrow">{categoryTitle}</span>
          <strong>{title}</strong>
          <span className="place-list-card__address"><MapPin size={13} aria-hidden="true" />{address}</span>
          <span className="place-list-card__status"><span className="green-dot" />{schedule}</span>
          <span className="place-list-card__verified"><ShieldCheck size={13} aria-hidden="true" />{getActualityLabel(place)}</span>
        </span>
      </Link>

      <div className="place-list-card__actions">
        {routeUrl ? (
          <a className="place-list-card__route" href={routeUrl} target="_blank" rel="noreferrer">
            <Navigation size={16} aria-hidden="true" />
            Маршрут
          </a>
        ) : (
          <span className="place-list-card__route is-disabled"><Navigation size={16} aria-hidden="true" /> Маршрут</span>
        )}
        {phone ? (
          <a className="place-list-card__icon-action" href={contactHref('phone', phone)} aria-label={t('places.call')}>
            <Phone size={17} aria-hidden="true" />
          </a>
        ) : null}
        <button
          type="button"
          className={`place-list-card__icon-action ${isFavorite ? 'is-active' : ''}`}
          aria-label={isFavorite ? t('favorites.removeLabel') : t('home.favoriteAdd')}
          onClick={() => {
            const added = toggleFavorite({ id: place.id, type: 'place', title, description });
            showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
          }}
        >
          <Heart size={17} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
