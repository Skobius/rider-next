import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../shared/layout/AppShell';
import { HomePage } from '../pages/HomePage/HomePage';
import { JourneyPage } from '../pages/JourneyPage/JourneyPage';
import { KnowledgePage } from '../pages/KnowledgePage/KnowledgePage';
import { MotorcyclePage } from '../pages/MotorcyclePage/MotorcyclePage';
import { OnboardingPage } from '../pages/OnboardingPage/OnboardingPage';
import { TrainingPage } from '../pages/TrainingPage/TrainingPage';
import { WelcomePage } from '../pages/WelcomePage/WelcomePage';
import { useRiderStore } from '../features/rider-profile/store';

export function App() {
  const status = useRiderStore((state) => state.profile.status);

  return (
    <Routes>
      <Route path="/" element={status ? <Navigate to="/home" replace /> : <WelcomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<AppShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/motorcycle" element={<MotorcyclePage />} />
        <Route path="/training" element={<TrainingPage />} />
      </Route>
    </Routes>
  );
}
