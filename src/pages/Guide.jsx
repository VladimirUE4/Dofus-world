import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import rawQuests from '../../dofus_dataset(2).json'

const rawQuestsWithIndex = rawQuests.map((q, idx) => ({ ...q, originalIndex: idx }));
// We don't sort here anymore, we trust the JSON order which interleaves categories and quests.
// If you must sort, ensure categories and quests stay together. For now, let's keep the JSON order.
const QUESTS = rawQuestsWithIndex;
const TOTAL = QUESTS.filter(q => q.type === 'quest').length;

function CategoryItem({ category }) {
    // Extract description from title if it follows "Title : description"
    let displayTitle = category.title;
    let desc = '';
    const splitIndex = category.title.indexOf(' : ');
    if (splitIndex !== -1) {
        displayTitle = category.title.substring(0, splitIndex);
        desc = category.title.substring(splitIndex + 3);
    }

    return (
        <div className="category-card">
            <div className="category-image-wrap">
                <img src={category.image} alt={category.step} className="category-image" />
                <div className="category-step-badge">{category.step}</div>
            </div>
            <div className="category-content">
                <div className="category-title">{displayTitle}</div>
                {desc && <div className="category-desc">{desc}</div>}
            </div>
        </div>
    )
}

function QuestItem({ quest, completed, onToggle, trackedMembersCompleted }) {
    const images = quest.images || []

    return (
        <div
            className={`quest-item${completed ? ' completed' : ''}`}
            onClick={() => onToggle(quest.id)}
        >
            <div className="quest-main-info">
                <div className="quest-checkbox-wrapper">
                    <input
                        type="checkbox"
                        className="quest-checkbox"
                        checked={completed}
                        onChange={() => onToggle(quest.id)}
                        onClick={e => e.stopPropagation()}
                        id={`quest-${quest.id}`}
                    />
                </div>

                <span className="quest-level-badge">Lvl {quest.questLevel}</span>

                <div className="quest-dataset-images">
                    {images.map((imgUrl, idx) => (
                        <img key={idx} src={imgUrl} alt="" className="quest-dataset-img" />
                    ))}
                </div>

                <span className="quest-name">{quest.name}</span>

                {trackedMembersCompleted && trackedMembersCompleted.length > 0 && (
                    <div className="quest-member-avatars">
                        {trackedMembersCompleted.map(member => (
                            <div key={member.id} className="quest-member-avatar" title={`${member.name} a terminé cette quête`}>
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                )}

                <a
                    href={quest.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quest-link"
                    onClick={e => e.stopPropagation()}
                >
                    Ouvrir le guide
                </a>
            </div>
            {quest.description && (
                <div className="quest-description">
                    {quest.description}
                </div>
            )}
        </div>
    )
}

export default function Guide() {
    const { currentUser } = useAuth()
    const [completedQuests, setCompletedQuests] = useState([])
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    // Guild specific state
    const [userGuildId, setUserGuildId] = useState(null)
    const [guildMembers, setGuildMembers] = useState([])
    const [trackedMemberIds, setTrackedMemberIds] = useState([]) // IDs of members the user chose to display

    // Real-time sync for User
    useEffect(() => {
        if (!currentUser) return
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setCompletedQuests(data.completedQuests || [])
                setUserGuildId(data.guildId || null)
            }
        })
        return unsub
    }, [currentUser])

    // Real-time sync for Guild Members
    useEffect(() => {
        if (!userGuildId) {
            setGuildMembers([])
            setTrackedMemberIds([])
            return
        }

        const unsubGuild = onSnapshot(doc(db, 'guilds', userGuildId), async (guildSnap) => {
            if (guildSnap.exists()) {
                const memberIds = guildSnap.data().members || []

                // Fetch profiles of all members except the current user
                const membersData = []
                for (const mId of memberIds) {
                    if (mId === currentUser.uid) continue; // Don't track self
                    // We set up a listener for EACH member to see real-time quest updates
                    // Note: In a massive app, you might want to limit this or do it differently,
                    // but for a small guild, listening to members is fine.
                    // For simplicity, we can fetch once per guild update, or better, set up individual listeners.
                }
            }
        })
        return unsubGuild
    }, [userGuildId, currentUser])

    // Let's set up individual listeners for guild members correctly
    useEffect(() => {
        if (!userGuildId) return;

        // Fetch the guild doc to get member IDs
        const initGuildMembers = async () => {
            const guildDoc = await getDoc(doc(db, 'guilds', userGuildId));
            if (!guildDoc.exists()) return;

            const memberIds = guildDoc.data().members || [];
            const otherMemberIds = memberIds.filter(id => id !== currentUser.uid);

            // We need to keep track of unsubscribe functions
            const unsubs = [];

            // Initialize members array
            setGuildMembers(current => {
                // Keep existing members to avoid flash, but reset if new guild
                return otherMemberIds.map(id => ({ id, name: 'Loading...', completedQuests: [] }))
            });

            otherMemberIds.forEach(mId => {
                const unsub = onSnapshot(doc(db, 'users', mId), (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        setGuildMembers(prev => {
                            const newMembers = [...prev];
                            const idx = newMembers.findIndex(m => m.id === mId);
                            if (idx >= 0) {
                                newMembers[idx] = {
                                    id: mId,
                                    name: data.displayName || 'Inconnu',
                                    completedQuests: data.completedQuests || []
                                };
                            } else {
                                newMembers.push({
                                    id: mId,
                                    name: data.displayName || 'Inconnu',
                                    completedQuests: data.completedQuests || []
                                });
                            }
                            return newMembers;
                        });
                    }
                });
                unsubs.push(unsub);
            });

            return () => {
                unsubs.forEach(u => u());
            };
        };

        const cleanupPromise = initGuildMembers();

        return () => {
            cleanupPromise.then(cleanup => {
                if (cleanup) cleanup();
            });
        };
    }, [userGuildId, currentUser]);


    const toggleQuest = useCallback(async (questId) => {
        if (updating) return
        const isCompleted = completedQuests.includes(questId)
        setUpdating(true)
        try {
            const userRef = doc(db, 'users', currentUser.uid)
            if (isCompleted) {
                await updateDoc(userRef, { completedQuests: arrayRemove(questId) })
            } else {
                await updateDoc(userRef, { completedQuests: arrayUnion(questId) })
            }
        } catch (e) {
            console.error(e)
        }
        setUpdating(false)
    }, [completedQuests, currentUser, updating])

    const filteredQuests = useMemo(() => {
        let list = QUESTS

        // If filtering, we might only want to show quests, not categories, or maybe both?
        // Usually, if searching or filtering completed, categories lose context.
        // Let's hide categories if a specific filter is active.
        const isFiltering = filter !== 'all' || search.trim() !== '';

        if (filter === 'completed') list = list.filter(q => q.type === 'category' || completedQuests.includes(q.id))
        else if (filter === 'remaining') list = list.filter(q => q.type === 'category' || (q.type === 'quest' && !completedQuests.includes(q.id)))

        if (search.trim()) {
            const s = search.toLowerCase()
            list = list.filter(q => q.type === 'category' || (q.name && q.name.toLowerCase().includes(s)))
        }

        // If filtering, remove empty categories (categories with no matching quests after them)
        if (isFiltering) {
            const finalFiltered = [];
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (item.type === 'category') {
                    // Look ahead to see if there's any quest before the next category
                    let hasQuests = false;
                    for (let j = i + 1; j < list.length; j++) {
                        if (list[j].type === 'category') break;
                        if (list[j].type === 'quest') hasQuests = true;
                    }
                    if (hasQuests) finalFiltered.push(item);
                } else {
                    finalFiltered.push(item);
                }
            }
            return finalFiltered;
        }

        return list
    }, [filter, search, completedQuests])

    // Reset pagination when filter or search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filter, search])

    const totalPages = Math.ceil(filteredQuests.length / itemsPerPage)
    const currentQuests = filteredQuests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const progressPct = TOTAL === 0 ? 0 : Math.round((completedQuests.length / TOTAL) * 100)

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Guide Optimisé</h1>
                <p className="page-subtitle">Suivez et sauvegardez votre avancée dans le jeu.</p>
            </div>

            {/* Progress Overview */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Progression totale
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                                {progressPct}%
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {completedQuests.length} / {TOTAL} quêtes complétées
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Restantes</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                            {TOTAL - completedQuests.length}
                        </div>
                    </div>
                </div>
                <div className="progress-bar-bg" style={{ height: '10px' }}>
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <input
                    type="text"
                    className="form-input filter-search"
                    placeholder="Rechercher une quête..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    id="quest-search"
                />
                {[
                    { key: 'all', label: `Toutes (${TOTAL})` },
                    { key: 'remaining', label: `Restantes (${TOTAL - completedQuests.length})` },
                    { key: 'completed', label: `Complétées (${completedQuests.length})` },
                ].map(f => (
                    <button
                        key={f.key}
                        id={`filter-${f.key}`}
                        className={`filter-btn${filter === f.key ? ' active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Guild Tracking Section */}
            {userGuildId && guildMembers.length > 0 && (
                <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>
                        Suivre l'avancée des membres de la guilde
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {guildMembers.map(member => {
                            const isTracked = trackedMemberIds.includes(member.id);
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => {
                                        setTrackedMemberIds(prev =>
                                            isTracked ? prev.filter(id => id !== member.id) : [...prev, member.id]
                                        );
                                    }}
                                    className={`guild-track-btn ${isTracked ? 'active' : ''}`}
                                    title={`${member.completedQuests.length} quêtes terminées`}
                                >
                                    <div className="guild-track-avatar">{member.name.charAt(0).toUpperCase()}</div>
                                    <span>{member.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Affichage de {filteredQuests.length} quête(s)
                {updating && <span style={{ marginLeft: '8px', color: 'var(--primary)' }}>Sauvegarde en cours...</span>}
            </div>

            {/* Quest List */}
            <div className="quest-list">
                {currentQuests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-text">Aucun résultat trouvé.</div>
                    </div>
                ) : (
                    currentQuests.map((item) => {
                        if (item.type === 'category') {
                            return <CategoryItem key={`cat-${item.originalIndex}`} category={item} />
                        }

                        // Determine which tracked members have completed this specific quest
                        const trackedMembersCompleted = guildMembers
                            .filter(m => trackedMemberIds.includes(m.id))
                            .filter(m => m.completedQuests.includes(item.id))
                            .map(m => ({ id: m.id, name: m.name }));

                        return (
                            <QuestItem
                                key={item.id}
                                quest={item}
                                completed={completedQuests.includes(item.id)}
                                onToggle={toggleQuest}
                                trackedMembersCompleted={trackedMembersCompleted}
                            />
                        )
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                        Précédent
                    </button>
                    <span className="page-info">
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button
                        className="page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                        Suivant
                    </button>
                </div>
            )}
        </div>
    )
}
