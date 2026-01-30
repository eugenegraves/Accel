import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ActiveSprintProvider } from './context/ActiveSprintContext';
import { ActiveLiftProvider } from './context/ActiveLiftContext';
import { ActiveMeetProvider } from './context/ActiveMeetContext';
import {
  HomePage,
  SprintPage,
  LiftPage,
  MeetPage,
  DistancePage,
  SettingsPage,
  SprintReviewPage,
  LiftReviewPage,
  LiftExerciseReviewPage,
  MeetReviewPage,
  InsightsPage,
  TemplatesPage,
  SprintTemplateDetailPage,
  LiftTemplateDetailPage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <ActiveSprintProvider>
        <ActiveLiftProvider>
          <ActiveMeetProvider>
            <div className="min-h-screen min-h-dvh flex flex-col bg-slate-900">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sprint/:sessionId" element={<SprintPage />} />
                <Route path="/lift/:sessionId" element={<LiftPage />} />
                <Route path="/meet/:meetId" element={<MeetPage />} />
                <Route path="/distance/:meters" element={<DistancePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Review Routes */}
                <Route path="/review/sprints" element={<SprintReviewPage />} />
                <Route path="/review/lifts" element={<LiftReviewPage />} />
                <Route path="/review/lift/:exercise" element={<LiftExerciseReviewPage />} />
                <Route path="/review/meets" element={<MeetReviewPage />} />

                {/* Insights Route */}
                <Route path="/insights" element={<InsightsPage />} />

                {/* Template Routes */}
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/templates/sprint/:templateId" element={<SprintTemplateDetailPage />} />
                <Route path="/templates/lift/:templateId" element={<LiftTemplateDetailPage />} />
              </Routes>
            </div>
          </ActiveMeetProvider>
        </ActiveLiftProvider>
      </ActiveSprintProvider>
    </BrowserRouter>
  );
}

export default App;
