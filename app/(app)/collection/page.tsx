"use client";

import { useEffect, useState } from "react";
import { subscribePosts, deletePost, updatePostName, FlowerPost } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";

export default function CollectionPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<FlowerPost[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribePosts(setPosts);
        return unsubscribe;
    }, []);

    const myPosts = posts.filter((p) => p.userId === user?.uid);


    async function handleSaveName(id: string) {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            await updatePostName(id, editName.trim());
        } finally {
            setSaving(false);
            setEditingId(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("この記録を削除しますか？")) return;
        await deletePost(id);
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="font-serif text-2xl font-bold" style={{ color: "var(--color-brown)" }}>
                    植物図鑑
                </h2>
                <div className="divider-ornament mt-2 w-48 mx-auto text-xs tracking-widest" style={{ color: "var(--color-sepia)" }} />
                <p className="mt-2 text-sm" style={{ color: "var(--color-sepia)" }}>
                    {myPosts.length} 種の記録
                </p>

            </div>

            {myPosts.length === 0 ? (

                <div className="card-antique p-12 text-center">
                    <div className="text-5xl mb-4">🌱</div>
                    <p className="font-serif text-base" style={{ color: "var(--color-brown-light)" }}>
                        まだ記録がありません
                    </p>
                    <p className="text-sm mt-2" style={{ color: "var(--color-sepia)" }}>
                        「記録する」から最初の花を登録しましょう！
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {myPosts.map((post) => {

                        const isOwner = user?.uid === post.userId;
                        const isEditing = editingId === post.id;

                        return (
                            <div key={post.id} className="card-antique overflow-hidden flex flex-col group">
                                {/* Image */}
                                <div className="relative aspect-square w-full overflow-hidden">
                                    <Image
                                        src={post.imageURL}
                                        alt={post.flowerName}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        style={{ filter: "sepia(15%) contrast(1.02)" }}
                                    />
                                    <div className="absolute inset-0 pointer-events-none"
                                        style={{ boxShadow: "inset 0 0 0 1px rgba(62,39,35,0.25)" }} />
                                </div>

                                {/* Info */}
                                <div className="p-3 flex flex-col gap-2">
                                    {isEditing ? (
                                        <div className="flex gap-1">
                                            <input
                                                className="input-antique text-sm py-1 flex-1"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSaveName(post.id)}
                                                autoFocus
                                            />
                                            <button
                                                className="btn-primary text-xs px-2 py-1"
                                                onClick={() => handleSaveName(post.id)}
                                                disabled={saving}
                                            >
                                                保存
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="font-serif text-sm font-semibold leading-tight"
                                            style={{ color: "var(--color-brown)" }}>
                                            {post.flowerName}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-end">

                                        {post.capturedAt && (
                                            <p className="text-xs shrink-0" style={{ color: "var(--color-sepia)" }}>
                                                {new Date(post.capturedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Owner actions */}
                                    {isOwner && !isEditing && (
                                        <div className="flex gap-1 pt-1 border-t" style={{ borderColor: "rgba(62,39,35,0.1)" }}>
                                            <button
                                                className="btn-secondary text-xs py-1 flex-1"
                                                onClick={() => { setEditingId(post.id); setEditName(post.flowerName); }}
                                            >
                                                編集
                                            </button>
                                            <button
                                                className="text-xs py-1 px-2 rounded transition-colors"
                                                style={{ color: "#c62828", border: "1px solid rgba(198,40,40,0.3)" }}
                                                onClick={() => handleDelete(post.id)}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    )}

                                    {isOwner && isEditing && (
                                        <button className="btn-secondary text-xs py-1"
                                            onClick={() => setEditingId(null)}>
                                            キャンセル
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
