import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CharacterProvider } from './contexts/CharacterContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Almanax = lazy(() => import('./pages/Almanax'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Guide = lazy(() => import('./pages/Guide'))
const Guild = lazy(() => import('./pages/Guild'))
const Profile = lazy(() => import('./pages/Profile'))
const PatchNotes = lazy(() => import('./pages/PatchNotes'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Boss = lazy(() => import('./pages/Boss'))

function PrivateRoute({ children }) {
    const { currentUser } = useAuth()
    return currentUser ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
    const { currentUser } = useAuth()
    return (
        <Router>
            <ScrollToTop />
            <div className="app-layout">
                <Navbar />
                <main className="main-content">
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>Chargement en cours...</div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/almanax" element={<Almanax />} />
                            <Route path="/bosses" element={<Boss />} />
                            <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
                            <Route path="/register" element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />} />
                            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                            <Route path="/guide" element={<PrivateRoute><Guide /></PrivateRoute>} />
                            <Route path="/guild" element={<PrivateRoute><Guild /></PrivateRoute>} />
                            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                            <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
                            <Route path="/patch-notes" element={<PatchNotes />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </main>
                <Footer />
            </div>
        </Router>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <CharacterProvider>
                <AppRoutes />
            </CharacterProvider>
        </AuthProvider>
    )
}
