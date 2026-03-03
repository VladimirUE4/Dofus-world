import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
    const { currentUser, logout } = useAuth()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    async function handleLogout() {
        await logout()
        setIsMenuOpen(false)
        navigate('/login')
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)

    const initials = (currentUser?.displayName || '?').slice(0, 2).toUpperCase()

    return (
        <nav className="navbar" id="navbar">
            <NavLink to="/" className="nav-brand" onClick={closeMenu}>
                <div className="nav-logo-icon">DW</div>
                <span className="nav-logo-text">Dofus World</span>
            </NavLink>

            {/* Mobile Toggle */}
            <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
                <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
            </button>

            <div className={`nav-links ${isMenuOpen ? 'show' : ''}`}>
                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
                    Accueil
                </NavLink>
                <NavLink to="/almanax" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
                    Almanax
                </NavLink>
                {currentUser && (
                    <>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/guide" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
                            Guide
                        </NavLink>
                        <NavLink to="/guild" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
                            Guilde
                        </NavLink>
                    </>
                )}

                {/* Mobile Logout / Login info inside menu */}
                <div className="mobile-user-actions">
                    {currentUser ? (
                        <>
                            <NavLink to="/profile" className="nav-link" onClick={closeMenu}>Profil</NavLink>
                            <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="nav-link" onClick={closeMenu}>Connexion</NavLink>
                            <NavLink to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>S'inscrire</NavLink>
                        </>
                    )}
                </div>
            </div>

            <div className="nav-user desktop-only">
                {currentUser ? (
                    <>
                        <NavLink to="/profile" className="user-avatar-link" title="Profil">
                            <div className="user-avatar">{initials}</div>
                        </NavLink>
                        <button className="btn-logout" onClick={handleLogout}>
                            Déconnexion
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" className="nav-link">Connexion</NavLink>
                        <NavLink to="/register" className="btn btn-primary btn-sm">S'inscrire</NavLink>
                    </>
                )}
            </div>
        </nav>
    )
}
