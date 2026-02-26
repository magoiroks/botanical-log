"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import { ReactNode } from "react";

const navItems = [
    { href: "/", label: "記録する", icon: "📷" },
    { href: "/map", label: "地図", icon: "🗺" },
    { href: "/collection", label: "図鑑", icon: "📖" },
];

function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-cream)" }}>
            {/* Top header */}
            <header className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "rgba(62,39,35,0.2)", backgroundColor: "#FAFAF0" }}>
                <h1 className="font-serif text-xl font-bold tracking-wide flex items-center gap-2" style={{ color: "var(--color-brown)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/icon-192.png" alt="icon" className="w-7 h-7 rounded-md" style={{ objectFit: "cover" }} />
                    Botanical Log
                </h1>

                {user && (
                    <div className="flex items-center gap-3">
                        {user.photoURL && (
                            <Image
                                src={user.photoURL}
                                alt={user.displayName ?? "user"}
                                width={32}
                                height={32}
                                className="rounded-full border"
                                style={{ borderColor: "rgba(62,39,35,0.3)" }}
                            />
                        )}
                        <button
                            onClick={() => signOut(auth)}
                            className="text-xs btn-secondary py-1 px-3"
                        >
                            退出
                        </button>
                    </div>
                )}
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom navigation bar */}
            <nav className="fixed bottom-0 left-0 right-0 flex border-t z-10"
                style={{
                    backgroundColor: "#FAFAF0",
                    borderColor: "rgba(62,39,35,0.2)",
                }}>
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex-1 flex flex-col items-center py-2 gap-1 transition-colors"
                            style={{
                                color: active ? "var(--color-green)" : "var(--color-sepia)",
                                backgroundColor: active ? "rgba(46,125,50,0.06)" : "transparent",
                            }}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs font-body tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <AppShell>{children}</AppShell>
        </AuthGuard>
    );
}
