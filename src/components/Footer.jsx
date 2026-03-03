import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
    // Hide specialized footer on home if we want to use the global one, 
    // but for now let's make the global one subtle
    return (
        <footer className="global-footer" style={{
            padding: '40px 20px',
            borderTop: '1px solid var(--v5-border)',
            marginTop: 'auto',
            background: 'var(--bg-primary)',
            textAlign: 'center'
        }}>
            <div className="footer-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.2rem',
                            fontWeight: '900',
                            color: 'white',
                            letterSpacing: '1px',
                            margin: 0
                        }}>
                            DOFUS WORLD
                        </p>
                        <span style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--v5-border)'
                        }}>
                            V0.1
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link to="/patch-notes" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                            Patch Notes
                        </Link>
                        <Link to="/guide" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                            Guide
                        </Link>
                        <Link to="/guild" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                            Guilde
                        </Link>
                        <a
                            href="https://discord.gg/FMeM9Ksf"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#5865F2', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                            Discord
                        </a>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0' }}>
                        Certaines illustrations sont la propriété d'Ankama Studio et de Dofus - Tous droits réservés.
                    </p>
                </div>
            </div>
        </footer>
    );
}
