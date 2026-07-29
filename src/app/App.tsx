import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { AdminContentPage } from '../pages/Admin/AdminContentPage';
import { AdminUsersPage } from '../pages/Admin/AdminUsersPage';
import { AuditLogPage } from '../pages/Admin/AuditLogPage';
import { ModerationPage } from '../pages/Admin/ModerationPage';
import { AuthPlaceholderPage } from '../pages/AuthPlaceholderPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { FeedbackPage } from '../pages/FeedbackPage';
import { SearchItemDetailsPage } from '../pages/Details/SearchItemDetailsPage';
import { PlaceDetailsPage } from '../pages/Details/PlaceDetailsPage';
import { TipDetailsPage } from '../pages/Details/TipDetailsPage';
import { HomePage } from '../pages/HomePage/HomePage';
import { AboutMg67Page } from '../pages/Info/AboutMg67Page';
import { AboutPage } from '../pages/Info/AboutPage';
import { LegalPlaceholderPage } from '../pages/Info/LegalPlaceholderPage';
import { InstallPage } from '../pages/InstallPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AccountPage } from '../pages/Profile/AccountPage';
import { MyClaimsPage } from '../pages/Profile/MyClaimsPage';
import { MyOrganizationsPage } from '../pages/Profile/MyOrganizationsPage';
import { MySubmissionsPage } from '../pages/Profile/MySubmissionsPage';
import { RegionPage } from '../pages/RegionPage';
import { SearchResultsPage } from '../pages/SearchResultsPage/SearchResultsPage';
import { CategoryPage } from '../pages/Sections/CategoryPage';
import { GuidePage } from '../pages/Sections/GuidePage';
import { PlaceholderPage } from '../pages/Sections/PlaceholderPage';
import { SectionsPage } from '../pages/Sections/SectionsPage';
import { SkillPage } from '../pages/Sections/SkillPage';
import { BehaviorPage } from '../pages/Settings/BehaviorPage';
import { LanguagePage } from '../pages/Settings/LanguagePage';
import { NotificationsSettingsPage } from '../pages/Settings/NotificationsSettingsPage';
import { ThemePage } from '../pages/Settings/ThemePage';
import { useI18n } from '../shared/i18n/useI18n';
import { AppShell } from '../shared/layout/AppShell';
import { ScrollToTop } from '../shared/ui/ScrollToTop';

const MapPage = lazy(() => import('../pages/MapPage').then((module) => ({ default: module.MapPage })));

function MapPageFallback() {
  const { t } = useI18n();

  return (
    <section className="motohub-screen simple-screen motohub-placeholder">
      <p className="motohub-kicker">{t('common.brand')}</p>
      <h1>{t('map.title')}</h1>
      <p>{t('map.text')}</p>
    </section>
  );
}

function SearchEntryPage() {
  const [params] = useSearchParams();
  const hasSearchParams = Boolean(params.get('q') || params.get('type') || params.get('category') || params.get('date') || params.get('featured'));

  return hasSearchParams ? <SearchResultsPage /> : <HomePage />;
}

export function App() {
  const { t } = useI18n();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/home" element={<Navigate to="/search" replace />} />
        <Route element={<AppShell />}>
          <Route path="/search" element={<SearchEntryPage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/sections/:slug" element={<SectionsPage />} />
          <Route path="/sections/:sectionSlug/:categorySlug" element={<CategoryPage />} />
          <Route path="/guides/:slug" element={<GuidePage />} />
          <Route path="/skill/:id" element={<SkillPage />} />
          <Route path="/placeholder/:id" element={<PlaceholderPage />} />
          <Route path="/place/:id" element={<PlaceDetailsPage />} />
          <Route path="/route/:id" element={<SearchItemDetailsPage />} />
          <Route path="/event/:id" element={<SearchItemDetailsPage />} />
          <Route path="/tip/:id" element={<TipDetailsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/region" element={<RegionPage />} />
          <Route path="/map" element={<Suspense fallback={<MapPageFallback />}><MapPage /></Suspense>} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/account" element={<AccountPage />} />
          <Route path="/profile/submissions" element={<MySubmissionsPage />} />
          <Route path="/profile/claims" element={<MyClaimsPage />} />
          <Route path="/profile/organizations" element={<MyOrganizationsPage />} />
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/audit" element={<AuditLogPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/settings/language" element={<LanguagePage />} />
          <Route path="/settings/theme" element={<ThemePage />} />
          <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
          <Route path="/settings/behavior" element={<BehaviorPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about-mg67" element={<AboutMg67Page />} />
          <Route path="/privacy" element={<LegalPlaceholderPage title={t('legal.privacy')} />} />
          <Route path="/terms" element={<LegalPlaceholderPage title={t('legal.terms')} />} />
          <Route path="/auth" element={<AuthPlaceholderPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </>
  );
}
