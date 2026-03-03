import { Link } from 'react-router-dom';
import bgImage from '../images/1489514696-7289-artwork.webp';
import featureImg1 from '../images/1489497253-9925-artwork.webp';
import featureImg2 from '../images/1489514225-2892-artwork.webp';
import featureImg3 from '../images/1489516940-5529-artwork.webp';

export default function Home() {
    return (
        <div className="home-page">
            <div className="hero-minimalist">
                <div className="hero-minimalist-bg" style={{ backgroundImage: `url(${bgImage})` }}>
                    <div className="hero-minimalist-overlay"></div>
                </div>

                <div className="hero-minimalist-content">
                    <span className="hero-minimalist-badge">Dofus World Beta</span>
                    <h1 className="hero-minimalist-title">
                        Votre Aventure. <br />
                        <span className="text-gradient">Repensée.</span>
                    </h1>
                    <p className="hero-minimalist-subtitle">
                        Une interface épurée, fluide et puissante pour suivre vos quêtes, organiser votre guilde et anticiper l'Almanax.
                    </p>
                    <div className="hero-minimalist-actions">
                        <Link to="/register" className="btn btn-primary btn-lg action-btn">Commencer</Link>
                        <Link to="/almanax" className="btn btn-ghost btn-lg action-btn margin-left-12">Voir l'Almanax</Link>
                    </div>
                </div>
            </div>

            <div className="features-minimalist">
                <section className="feature-row">
                    <div className="feature-row-text">
                        <span className="feature-row-overline">01 — Coordination</span>
                        <h2 className="feature-row-title">Gestion de Guilde</h2>
                        <p className="feature-row-desc">
                            Oubliez la complexité. Centralisez vos effectifs et objectifs au sein d'un tableau de bord clair, aéré et pensé pour la compétition sereine.
                        </p>
                        <Link to="/register" className="feature-row-link">Créer ma guilde ➔</Link>
                    </div>
                    <div className="feature-row-visual">
                        <img src={featureImg1} alt="Gestion de guilde" className="feature-row-img floating" />
                        <div className="feature-blob blob-1"></div>
                    </div>
                </section>

                <section className="feature-row reverse">
                    <div className="feature-row-text">
                        <span className="feature-row-overline">02 — Prédiction</span>
                        <h2 className="feature-row-title">Almanax Fluide</h2>
                        <p className="feature-row-desc">
                            Anticipez le marché. Visualisez les 31 prochains jours ou naviguez librement à travers les mois sans aucune friction.
                        </p>
                        <Link to="/almanax" className="feature-row-link">Explorer le calendrier ➔</Link>
                    </div>
                    <div className="feature-row-visual">
                        <img src={featureImg2} alt="Almanax" className="feature-row-img floating-delay" />
                        <div className="feature-blob blob-2"></div>
                    </div>
                </section>

                <section className="feature-row">
                    <div className="feature-row-text">
                        <span className="feature-row-overline">03 — Ascension</span>
                        <h2 className="feature-row-title">L'Art de l'Opti</h2>
                        <p className="feature-row-desc">
                            L'information essentielle, concentrée. Un guide visuellement apaisant regroupant tout ce dont vous avez besoin pour triompher.
                        </p>
                        <Link to="/guide" className="feature-row-link">Consulter le guide ➔</Link>
                    </div>
                    <div className="feature-row-visual">
                        <img src={featureImg3} alt="Guide d'optimisation" className="feature-row-img floating" />
                        <div className="feature-blob blob-3"></div>
                    </div>
                </section>
            </div>
        </div>
    );
}
