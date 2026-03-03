import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CharacterProvider } from './contexts/CharacterContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Almanax from './pages/Almanax'
import Dashboard from './pages/Dashboard'
import Guide from './pages/Guide'
import Guild from './pages/Guild'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'

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
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/almanax" element={<Almanax />} />
                        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
                        <Route path="/register" element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/guide" element={<PrivateRoute><Guide /></PrivateRoute>} />
                        <Route path="/guild" element={<PrivateRoute><Guild /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
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
