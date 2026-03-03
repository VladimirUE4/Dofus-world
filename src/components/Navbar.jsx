import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'
import CharacterModal from './CharacterModal'
import CharacterSelectionModal from './CharacterSelectionModal'

export default function Navbar() {
    const { currentUser, logout } = useAuth()
    const { characters, activeCharacter, setActiveCharacterId } = useCharacter()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isCharModalOpen, setIsCharModalOpen] = useState(false)
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    async function handleLogout() {
        await logout()
        setIsMenuOpen(false)
        navigate('/login')
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)


    return (
        <nav className="navbar" id="navbar">
            <NavLink to="/" className="nav-brand" onClick={closeMenu}>
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

                        <div className="user-profile-dropdown-container">
                            <div className="user-avatar" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                {(currentUser.displayName || '?')[0].toUpperCase()}
                            </div>

                            {isProfileOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <span className="user-name">{currentUser.displayName}</span>
                                        <span className="user-email">{currentUser.email}</span>
                                    </div>
                                    <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>Profil</Link>
                                    <Link to="/guide" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>Guide</Link>
                                    <button className="dropdown-item" onClick={() => { setIsSelectionModalOpen(true); setIsProfileOpen(false); }}>
                                        Changer de personnage
                                    </button>
                                    <button className="dropdown-item logout" onClick={handleLogout}>Déconnexion</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" className="nav-link">Connexion</NavLink>
                        <NavLink to="/register" className="btn btn-primary btn-sm">S'inscrire</NavLink>
                    </>
                )}
            </div>

            <CharacterModal
                isOpen={isCharModalOpen}
                onClose={() => setIsCharModalOpen(false)}
            />
            <CharacterSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                onAddCharacter={() => {
                    setIsSelectionModalOpen(false);
                    setIsCharModalOpen(true);
                }}
            />
        </nav>
    )
}
