"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace("/");
        }
    }, [user, loading, router]);

    async function handleGoogleLogin() {
        try {
            await signInWithPopup(auth, googleProvider);
            router.replace("/");
        } catch (err) {
            console.error("Login error:", err);
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: "var(--color-cream)" }}>
            {/* Header ornament */}
            <div className="mb-10 flex flex-col items-center gap-3 animate-fade-in">
                <div className="text-5xl select-none">🌿</div>
                <h1 className="font-serif text-4xl font-bold tracking-wide"
                    style={{ color: "var(--color-brown)" }}>
                    Botanical Log
                </h1>
                <div className="divider-ornament w-48 text-xs tracking-[0.3em] uppercase"
                    style={{ color: "var(--color-sepia)" }}>
                    Flora Journal
                </div>
                <p className="text-center text-sm leading-relaxed mt-2 max-w-xs"
                    style={{ color: "var(--color-brown-light)", fontFamily: "var(--font-body)" }}>
                    たくさん歩いて、たくさん見つける。
                </p>
            </div>

            {/* Login card */}
            <div className="card-antique w-full max-w-sm p-8 animate-fade-in flex flex-col items-center gap-6"
                style={{ animationDelay: "0.15s" }}>
                <p className="font-serif text-lg" style={{ color: "var(--color-brown)" }}>
                    ご入室ください
                </p>
                <div className="divider-ornament w-full" />

                <button
                    onClick={handleGoogleLogin}
                    className="btn-primary w-full flex items-center justify-center gap-3 py-3"
                >
                    {/* Google G icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Googleでログイン
                </button>

                <p className="text-xs text-center leading-relaxed"
                    style={{ color: "var(--color-sepia)" }}>
                    招待された方のみご利用いただけます。
                </p>
            </div>

            {/* Footer */}
            <p className="mt-10 text-xs tracking-widest uppercase"
                style={{ color: "var(--color-sepia)", opacity: 0.7, fontFamily: "var(--font-body)" }}>
                © 2025 Botanical Log
            </p>
        </main>
    );
}
