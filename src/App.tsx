import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Players } from './pages/Players'
import { PlayerProfile } from './pages/PlayerProfile'
import { Compare } from './pages/Compare'
import { Teams } from './pages/Teams'
import { TeamProfile } from './pages/TeamProfile'
import { Leaders } from './pages/Leaders'
import { TrophyCase } from './pages/TrophyCase'
import { UploadPage } from './pages/Upload'
import { useCanonicalLoader } from './hooks/useCanonicalLoader'

export default function App() {
  useCanonicalLoader()
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/team/:name" element={<TeamProfile />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/leaders" element={<Leaders />} />
          <Route path="/trophies" element={<TrophyCase />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
