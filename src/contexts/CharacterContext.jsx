import { createContext, useContext, useEffect, useState } from 'react'
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const CharacterContext = createContext()

export function useCharacter() {
    return useContext(CharacterContext)
}

export function CharacterProvider({ children }) {
    const { currentUser, userData } = useAuth()
    const [characters, setCharacters] = useState([])
    const [activeCharacterId, setActiveCharacterId] = useState(null)
    const [loading, setLoading] = useState(true)

    const activeCharacter = characters.find(c => c.id === activeCharacterId) || null

    useEffect(() => {
        if (!currentUser) {
            setCharacters([])
            setActiveCharacterId(null)
            setLoading(false)
            return
        }

        const userDocRef = doc(db, 'users', currentUser.uid)
        setLoading(true)

        // Listen to character changes in the user document
        const currentUid = currentUser.uid
        const unsub = onSnapshot(userDocRef, (docSnap) => {
            // Guard: ensure we only update for the current user session
            if (currentUser.uid !== currentUid) return;

            if (docSnap.exists()) {
                const data = docSnap.data()
                const charList = data.characters || []
                setCharacters(charList)

                // Set active character if not set or if current active is gone
                if (!activeCharacterId && charList.length > 0) {
                    setActiveCharacterId(charList[0].id)
                } else if (activeCharacterId && !charList.find(c => c.id === activeCharacterId)) {
                    setActiveCharacterId(charList.length > 0 ? charList[0].id : null)
                }
            }
            setLoading(false)
        })

        return unsub
    }, [currentUser])

    async function addCharacter(character) {
        if (!currentUser) return

        const newCharacter = {
            id: Date.now().toString(),
            completedQuests: [],
            ...character
        }

        const userDocRef = doc(db, 'users', currentUser.uid)
        const newCharacters = [...characters, newCharacter]

        await updateDoc(userDocRef, {
            characters: newCharacters
        })

        setActiveCharacterId(newCharacter.id)
    }

    async function updateCharacter(charId, updates) {
        if (!currentUser) return

        const newCharacters = characters.map(c =>
            c.id === charId ? { ...c, ...updates } : c
        )

        const userDocRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userDocRef, {
            characters: newCharacters
        })
    }

    async function deleteCharacter(charId) {
        if (!currentUser) return

        const newCharacters = characters.filter(c => c.id !== charId)
        const userDocRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userDocRef, {
            characters: newCharacters
        })

        if (activeCharacterId === charId) {
            setActiveCharacterId(newCharacters.length > 0 ? newCharacters[0].id : null)
        }
    }

    async function toggleQuest(questId) {
        if (!activeCharacter || !currentUser) return

        const isCompleted = activeCharacter.completedQuests?.includes(questId)
        const newCompleted = isCompleted
            ? activeCharacter.completedQuests.filter(id => id !== questId)
            : [...(activeCharacter.completedQuests || []), questId]

        await updateCharacter(activeCharacter.id, {
            completedQuests: newCompleted
        })
    }

    const value = {
        characters,
        activeCharacter,
        activeCharacterId,
        setActiveCharacterId,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        toggleQuest,
        loading
    }

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    )
}
