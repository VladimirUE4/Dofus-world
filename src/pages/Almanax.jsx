import { useState, useEffect } from 'react';

export default function Almanax() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        async function fetchAlmanax() {
            setLoading(true);
            try {
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 12);

                const fromDateStr = firstDay.toISOString().split('T')[0];
                const toDateStr = lastDay.toISOString().split('T')[0];

                const url = `https://api.dofusdu.de/dofus3/v1/fr/almanax?range%5Bfrom%5D=${fromDateStr}&range%5Bto%5D=${toDateStr}&range%5Bsize%5D=-1&timezone=Europe%2FParis&level=200`;
                const response = await fetch(url);
                const result = await response.json();

                if (Array.isArray(result)) {
                    setData(result);
                } else {
                    setData([]);
                }
            } catch (error) {
                console.error("Erreur de récupération de l'almanax:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        fetchAlmanax();
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let formatted = new Date(dateString).toLocaleDateString('fr-FR', options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <div className="almanax-page">
            <div className="page-header text-center">
                <h1 className="page-title">Almanax - {capitalizedMonth}</h1>
                <p className="page-subtitle">Préparez vos offrandes et anticipez les bonus mois par mois.</p>

                <div className="almanax-navigation">
                    <button className="btn btn-secondary" onClick={handlePrevMonth}>&larr; Mois précédent</button>
                    <button className="btn btn-secondary margin-left-12" onClick={handleNextMonth}>Mois suivant &rarr;</button>
                </div>
            </div>

            {loading ? (
                <div className="almanax-state-container">
                    <div className="spinner"></div>
                    <p className="state-text">Consultation des astres en cours...</p>
                </div>
            ) : data.length === 0 ? (
                <div className="almanax-state-container">
                    <p className="state-text">Impossible de charger l'Almanax pour le moment.</p>
                </div>
            ) : (
                <div className="almanax-grid">
                    {data.map((day) => (
                        <div className="almanax-card" key={day.date}>
                            <div className="almanax-header">
                                <div className="almanax-date">{formatDate(day.date)}</div>
                            </div>

                            <div className="almanax-body">
                                <div className="almanax-tribute">
                                    <div className="tribute-image-wrap">
                                        <img src={day.tribute.item.image_urls.sd} alt={day.tribute.item.name} className="tribute-image" />
                                        <div className="tribute-quantity-badge">x{day.tribute.quantity}</div>
                                    </div>
                                    <div className="tribute-name">{day.tribute.item.name}</div>
                                </div>

                                <div className="almanax-bonus">
                                    <span className="bonus-type">{day.bonus.type.name}</span>
                                    <p className="bonus-desc">{day.bonus.description}</p>
                                </div>
                            </div>

                            <div className="almanax-footer">
                                <div className="reward kamas">
                                    <span className="reward-icon">💰</span>
                                    <span className="reward-value">{day.reward_kamas.toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="reward xp">
                                    <span className="reward-icon">⭐</span>
                                    <span className="reward-value">{day.reward_xp.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
