import { ArrowLeft, Check, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRegionById, regions } from '../data/regions';
import { useI18n } from '../shared/i18n/useI18n';
import { updateGuestSettings, useGuestSettings } from '../shared/storage/guestSettings';

const regionTypeKey = {
  republic: 'region.typeRepublic',
  krai: 'region.typeKrai',
  oblast: 'region.typeOblast',
  federal_city: 'region.typeFederalCity',
  autonomous_oblast: 'region.typeAutonomousOblast',
  autonomous_okrug: 'region.typeAutonomousOkrug',
};

export function RegionPage() {
  const settings = useGuestSettings();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const selectedRegion = getRegionById(settings.regionId);
  const filteredRegions = useMemo(() => {
    const value = query.trim().toLowerCase();
    return regions.filter((region) => region.name.toLowerCase().includes(value) || region.shortName?.toLowerCase().includes(value));
  }, [query]);

  function selectRegion(regionId: string) {
    updateGuestSettings({ regionId });
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('common.backToProfile')}
      </Link>

      <header className="simple-screen__header">
        <p>{t('region.kicker')}</p>
        <h1>{t('region.title')}</h1>
        <span>{t('region.subtitle')}</span>
      </header>

      <section className="current-region-card">
        <span>
          <MapPin size={18} aria-hidden="true" />
          {t('region.current')}
        </span>
        <strong>{selectedRegion.shortName ?? selectedRegion.name}</strong>
        {!selectedRegion.isAvailable ? (
          <p>{t('region.unavailableText')}</p>
        ) : null}
      </section>

      <label className="region-search">
        <Search size={19} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('region.searchPlaceholder')} />
      </label>

      <div className="region-list">
        {filteredRegions.map((region) => (
          <button
            className={`region-row ${settings.regionId === region.id ? 'region-row--active' : ''}`}
            key={region.id}
            type="button"
            onClick={() => selectRegion(region.id)}
          >
            <span>
              <MapPin size={18} aria-hidden="true" />
              <span>
                <strong>{region.name}</strong>
                <small>{t(regionTypeKey[region.type])} · {region.isAvailable ? t('region.filled') : t('region.filling')}</small>
              </span>
            </span>
            {settings.regionId === region.id ? <Check size={19} aria-hidden="true" /> : null}
          </button>
        ))}
        {!filteredRegions.length ? <p className="version-note">{t('region.notFound')}</p> : null}
      </div>

      {!selectedRegion.isAvailable ? (
        <section className="soft-callout">
          <strong>{t('region.calloutTitle')}</strong>
          <p>{t('region.calloutText')}</p>
          <Link to="/profile/submissions">{t('region.suggest')}</Link>
        </section>
      ) : null}
    </section>
  );
}
