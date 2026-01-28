import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { SubmitPage } from './pages/SubmitPage';
import { DocsPage } from './pages/DocsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { LicensePage } from './pages/LicensePage';
import { CrispChat } from './components/CrispChat';
import { PostHogProvider } from './components/PostHogProvider';

function App() {
  return (
    <PostHogProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/skill/:id" element={<SkillDetailPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/license" element={<LicensePage />} />
        </Routes>
      </Layout>
      <CrispChat />
    </PostHogProvider>
  );
}

export default App;
