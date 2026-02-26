"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Prevent Firebase from initializing during SSR
const AuthProvider = dynamic(
    () => import("@/lib/AuthContext").then((m) => m.AuthProvider),
    { ssr: false, loading: () => null }
);

export default function ClientProviders({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
