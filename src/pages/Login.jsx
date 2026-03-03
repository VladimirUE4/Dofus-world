import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import loginBg from '../images/1489512202-5523-artwork.webp'

export default function Login() {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
        } catch (err) {
            setError('Email ou mot de passe incorrect. Réessayez.')
        }
        setLoading(false)
    }

    return (
        <div className="auth-split-container fade-in">
            <Link to="/" className="auth-back-btn" title="Retourner à l'accueil">
                ←
            </Link>
            {/* Left Image Pane */}
            <div
                className="auth-image-pane"
                style={{ backgroundImage: `url(${loginBg})` }}
            >
                <div className="auth-image-content">
                    <h1 className="auth-image-title">Plongez dans l'univers</h1>
                    <p className="auth-image-subtitle">Retrouvez vos guides, suivez votre progression et explorez le Monde des Douze.</p>
                </div>
            </div>

            {/* Right Form Pane */}
            <div className="auth-form-pane">
                <div className="auth-form-wrapper">
                    <Link to="/" className="auth-logo">
                        <div className="auth-logo-icon">D</div>
                        <span className="auth-logo-text">Dofus World</span>
                    </Link>

                    <div className="auth-header">
                        <h2 className="auth-heading">Bon retour !</h2>
                        <p className="auth-desc">Connectez-vous pour continuer votre aventure.</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input-premium"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Mot de passe</label>
                                {/* Future feature: <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>Oublié ?</Link> */}
                            </div>
                            <input
                                type="password"
                                className="form-input-premium"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-premium" disabled={loading}>
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>

                    <div className="auth-divider">Nouveau par ici ?</div>

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/register" className="btn btn-secondary btn-full" style={{ padding: '14px 24px', borderRadius: 'var(--radius-md)' }}>
                            Créer un compte
                        </Link>
                    </div>

                    <div className="auth-disclaimer">
                        Ne renseignez <strong>jamais</strong> vos identifiants Ankama ou Dofus officiels. Ce profil est strictement propre à ce site.
                    </div>
                </div>
            </div>
        </div>
    )
}
