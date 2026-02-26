"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ReactNode } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4 text-brown-light">
                    <div className="spinner" />
                    <p className="font-body text-sm tracking-widest">読み込み中…</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}
