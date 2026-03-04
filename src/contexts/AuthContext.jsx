import { createContext, useContext, useEffect, useState } from 'react'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)

    async function register(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName })
        await setDoc(doc(db, 'users', cred.user.uid), {
            displayName,
            email,
            guildId: null,
            completedQuests: [],
            createdAt: serverTimestamp(),
        })
        return cred.user
    }

    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password)
    }

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        const user = result.user

        const snap = await getDoc(doc(db, 'users', user.uid))
        if (!snap.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                displayName: user.displayName || 'Joueur',
                email: user.email,
                guildId: null,
                completedQuests: [],
                createdAt: serverTimestamp(),
            })
        }
        return user
    }

    function logout() {
        return signOut(auth)
    }

    async function fetchUserData(user) {
        if (!user) {
            setUserData(null)
            return
        }
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
            setUserData({ id: snap.id, ...snap.data() })
        }
    }

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            await fetchUserData(user)
            setLoading(false)
        })
        return unsub
    }, [])

    const value = {
        currentUser,
        userData,
        setUserData,
        register,
        login,
        loginWithGoogle,
        logout,
        fetchUserData,
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
