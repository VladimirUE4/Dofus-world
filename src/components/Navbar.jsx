import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
    const { currentUser, logout } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    const initials = (currentUser?.displayName || '?').slice(0, 2).toUpperCase()

    return (
        <nav className="navbar" id="navbar">
            <div className="navbar-logo">
                <span className="navbar-logo-title">Dofus World</span>
            </div>

            <div className="navbar-nav">
                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Accueil
                </NavLink>
                <NavLink to="/almanax" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Almanax
                </NavLink>
                {currentUser && (
                    <>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            Tableau de bord
                        </NavLink>
                        <NavLink to="/guide" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            Guide Optimisé
                        </NavLink>
                        <NavLink to="/guild" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            Guilde
                        </NavLink>
                    </>
                )}
            </div>

            <div className="navbar-user">
                {currentUser ? (
                    <>
                        <NavLink to="/profile" className="navbar-avatar-link" title="Profil">
                            <div className="navbar-avatar">{initials}</div>
                        </NavLink>
                        <div className="navbar-username">{currentUser.displayName}</div>
                        <button className="btn btn-ghost btn-sm margin-left-12" onClick={handleLogout}>
                            Déconnexion
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" className="btn btn-ghost btn-sm">Se connecter</NavLink>
                        <NavLink to="/register" className="btn btn-primary btn-sm margin-left-12">S'inscrire</NavLink>
                    </>
                )}
            </div>
        </nav>
    )
}
