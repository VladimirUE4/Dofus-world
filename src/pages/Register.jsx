import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
        <div className="auth-page">
            <div className="auth-card fade-in-up">
                <h1 className="auth-title">Inscription</h1>
                <p className="auth-subtitle">Créez votre compte pour suivre votre guide.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nom d'affichage</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Votre nom"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
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
                            className="form-input"
                            placeholder="Min. 6 caractères"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '8px' }}>
                        Créer le compte
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Déjà un compte ?{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    )
}
