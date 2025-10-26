import { createContext, useContext, useState, useEffect } from "react";
import axios from "@/lib/axios";
import { clearEvents } from "@/lib/telemetry";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('/api/auth/refresh');
                const { role, email, name, user, profilePicture, id } = res.data || {};
                const derivedEmail = email ?? user?.email ?? null;
                const derivedName = name ?? user?.name ?? (derivedEmail ? derivedEmail.split('@')[0] : null);
                const derivedUserId = id ?? user?.id ?? user?._id ?? null;
                
                console.log('[Auth] User ID extracted:', derivedUserId);
                console.log('[Auth] Full response:', res.data);
                
                setAuth({
                    accessToken: true, // Token is in httpOnly cookie, not accessible to JS
                    userId: derivedUserId,
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

    useEffect(() => {
        if (typeof window === "undefined" || loading) {
            return;
        }

        const storage = window.localStorage;
        const currentUserId = auth?.userId ? `user:${auth.userId}` : "guest";
        const previousId = storage.getItem("phishnclick.telemetry.user");

        // Only clear localStorage on user change (backend handles per-user isolation)
        if (previousId && previousId !== currentUserId && currentUserId === "guest") {
            storage.removeItem("phishnclick.telemetry.v1");
            window.dispatchEvent(new StorageEvent("storage", { key: "phishnclick.telemetry.v1" }));
        }
        
        storage.setItem("phishnclick.telemetry.user", currentUserId);
    }, [auth?.userId, loading]);

    return (
        <AuthContext.Provider value={{auth, setAuth, loading}}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext);
