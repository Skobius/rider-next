import { ArrowUpRight, Heart, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlaceItem } from '../../data/places';
import { getPlacePrimaryBranch, productLabels, verificationLabels } from '../../data/places';
import { getLocalizedText } from '../i18n/localizedText';
import { useI18n } from '../i18n/useI18n';
import { toggleFavorite, useFavorites } from '../storage/favoritesStore';
import { showToast } from './toastStore';
import { ImageWithFallback } from './ImageWithFallback';

export function PlaceCard({ place, from }: { place: PlaceItem; from?: string }) {
  const { language, t } = useI18n();
  const favorites = useFavorites();
  const title = getLocalizedText(place.name, language);
  const description = getLocalizedText(place.shortDescription, language);
  const branch = getPlacePrimaryBranch(place);
  const isFavorite = favorites.some((favorite) => favorite.id === place.id && favorite.type === 'place');
  const chips = [...(place.products ?? []), ...(place.features ?? [])].slice(0, 5);

  return (
    <Link className="place-list-card" to={`/place/${place.id}`} state={{ from }}>
      <span className="place-list-card__media">
        <ImageWithFallback src={place.coverImage ?? place.image} alt={title} />
      </span>

      <span className="place-list-card__body">
        <b className={`place-status-badge status-${place.verificationStatus}`}>
          <ShieldCheck size={13} aria-hidden="true" />
          {getLocalizedText(verificationLabels[place.verificationStatus], language)}
        </b>
        <strong>{title}</strong>
        <small>{description}</small>
        {branch?.address ? (
          <em><MapPin size={13} aria-hidden="true" /> {getLocalizedText(branch.address, language)}</em>
        ) : null}
        {chips.length ? (
          <span className="place-chip-row">
            {chips.map((chip) => <i key={chip}>{getLocalizedText(productLabels[chip] ?? { ru: chip, en: chip }, language)}</i>)}
          </span>
        ) : null}
      </span>

      <span className="place-list-card__actions">
        <button
          type="button"
          className={isFavorite ? 'is-active' : ''}
          aria-label={t('home.favoriteAdd')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const added = toggleFavorite({ id: place.id, type: 'place', title, description });
            showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
          }}
        >
          <Heart size={17} aria-hidden="true" />
        </button>
        <span>
          {t('search.open')}
          <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
