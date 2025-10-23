import { createContext, useContext, useState, useEffect } from "react";
import axios from "@/lib/axios";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('/api/auth/refresh');
                const { role, email, name, user, profilePicture } = res.data || {};
                const derivedEmail = email ?? user?.email ?? null;
                const derivedName = name ?? user?.name ?? (derivedEmail ? derivedEmail.split('@')[0] : null);
                setAuth({
                    accessToken: true, // Token is in httpOnly cookie, not accessible to JS
                    role,
                    email: derivedEmail,
                    name: derivedName,
                    profilePicture: profilePicture ?? user?.profilePicture ?? null,
                });
            } catch (error) {
                // Silently fail - user can play as guest
                // Only log if it's not a 404 (endpoint not found)
                if (error.response && error.response.status !== 404) {
                    console.log('Auth check failed:', error.message);
                }
                setAuth(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{auth, setAuth, loading}}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext);
