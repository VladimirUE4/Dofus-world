import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import registerBg from '../images/1489514696-7289-artwork.webp'

export default function Register() {
    const { register } = useAuth()
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.')
            return
        }
        if (password.length < 6) {
            setError('Le mot de passe doit faire au moins 6 caractères.')
            return
        }
        if (displayName.trim().length < 2) {
            setError('Le nom doit faire au moins 2 caractères.')
            return
        }
        setLoading(true)
        try {
            await register(email, password, displayName.trim())
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Cet email est déjà utilisé.')
            } else {
                setError('Erreur lors de la création du compte.')
            }
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
                style={{ backgroundImage: `url(${registerBg})` }}
            >
                <div className="auth-image-content">
                    <h1 className="auth-image-title">Rejoignez la communauté</h1>
                    <p className="auth-image-subtitle">Créez votre compte pour suivre vos guides, partager avec votre guilde et organiser vos almanax.</p>
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
                        <h2 className="auth-heading">Inscription</h2>
                        <p className="auth-desc">Créez votre compte en quelques secondes.</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nom d'affichage</label>
                            <input
                                type="text"
                                className="form-input-premium"
                                placeholder="Votre pseudo en jeu"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                required
                            />
                        </div>
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
                        <div className="form-group">
                            <label className="form-label">Mot de passe</label>
                            <input
                                type="password"
                                className="form-input-premium"
                                placeholder="Min. 6 caractères"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label className="form-label">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                className="form-input-premium"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-premium" disabled={loading}>
                            {loading ? 'Création en cours...' : 'Créer mon compte'}
                        </button>
                    </form>

                    <div className="auth-divider">Déjà membre ?</div>

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/login" className="btn btn-secondary btn-full" style={{ padding: '14px 24px', borderRadius: 'var(--radius-md)' }}>
                            Se connecter
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
