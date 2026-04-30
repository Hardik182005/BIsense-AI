import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CompliancePage from './pages/CompliancePage'
import DashboardPage from './pages/DashboardPage'
import StandardsPage from './pages/StandardsPage'
import ChecklistPage from './pages/ChecklistPage'
import GraphPage from './pages/GraphPage'
import AnalyticsPage from './pages/AnalyticsPage'
import HistoryPage from './pages/HistoryPage'
import Navbar from './components/Navbar'
import Chatbot from './components/Chatbot'

function App() {
  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="bg-gradient-mesh" />
        <div className="bg-noise" />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/standards" element={<StandardsPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
        <Chatbot />
      </div>
    </Router>
  )
}

export default App
