import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { SubmitPage } from './pages/SubmitPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/skill/:id" element={<SkillDetailPage />} />
        <Route path="/submit" element={<SubmitPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
