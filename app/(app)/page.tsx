"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { uploadImage } from "@/lib/storage";
import { addPost } from "@/lib/firestore";
import Image from "next/image";
import exifr from "exifr";
import heic2any from "heic2any";


type Step = "select" | "converting" | "identifying" | "choose" | "uploading" | "done";


export default function HomePage() {
    const { user } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>("select");
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [exifLat, setExifLat] = useState<number | null>(null);
    const [exifLng, setExifLng] = useState<number | null>(null);
    const [capturedAt, setCapturedAt] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string>("");
    const [customName, setCustomName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setStep("select");
        setPreviewURL(null);
        setFile(null);
        setExifLat(null);
        setExifLng(null);
        setCapturedAt(null);
        setCandidates([]);
        setSelectedName("");
        setCustomName("");
        setError(null);
        if (fileRef.current) fileRef.current.value = "";
    }, []);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setError(null);

        // Convert HEIC/HEIF to JPEG if needed
        const isHeic =
            f.type === "image/heic" ||
            f.type === "image/heif" ||
            f.name.toLowerCase().endsWith(".heic") ||
            f.name.toLowerCase().endsWith(".heif");

        let processedFile: File = f;
        if (isHeic) {
            setStep("converting");
            try {
                const converted = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.85 });
                const blob = Array.isArray(converted) ? converted[0] : converted;
                processedFile = new File([blob], f.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
            } catch {
                setError("HEIC画像の変換に失敗しました。JPEGで再試行してください。");
                setStep("select");
                return;
            }
            setStep("select");
        }

        setFile(processedFile);
        setPreviewURL(URL.createObjectURL(processedFile));

        // Extract Exif (from original HEIC file — exifr supports it)
        try {
            const exif = await exifr.parse(f, ["GPSLatitude", "GPSLongitude", "DateTimeOriginal"]);
            if (exif?.latitude) setExifLat(exif.latitude);
            if (exif?.longitude) setExifLng(exif.longitude);
            if (exif?.DateTimeOriginal) {
                setCapturedAt(new Date(exif.DateTimeOriginal).toISOString());
            }
        } catch {
            // Exif not available — that's fine
        }
    }


    /** Compress image to stay under Vercel's 4.5MB payload limit */
    async function compressImageForAPI(sourceFile: File): Promise<File> {
        const MAX_PX = 1024;
        const QUALITY = 0.75;
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const url = URL.createObjectURL(sourceFile);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error("圧縮失敗")); return; }
                        resolve(new File([blob], "image.jpg", { type: "image/jpeg" }));
                    },
                    "image/jpeg",
                    QUALITY
                );
            };
            img.onerror = reject;
            img.src = url;
        });
    }


    async function handleIdentify() {
        if (!file || !user) return;
        setStep("identifying");
        setError(null);
        try {
            // Compress before sending — Vercel free tier has a 4.5MB payload limit
            const compressed = await compressImageForAPI(file);
            const formData = new FormData();
            formData.append("file", compressed);

            const res = await fetch("/api/identify", {
                method: "POST",
                body: formData,
            });

            // Safely parse JSON — Safari throws DOMException if response is non-JSON (e.g. 500 HTML)
            let data: { candidates?: string[]; error?: string };
            try {
                data = await res.json();
            } catch {
                throw new Error(`サーバーエラーが発生しました (HTTP ${res.status})`);
            }

            if (!res.ok) throw new Error(data.error ?? "AI識別に失敗しました");

            setCandidates(data.candidates ?? []);
            setSelectedName(data.candidates?.[0] ?? "");
            setStep("choose");
        } catch (err) {
            setError(err instanceof Error ? err.message : "エラーが発生しました");
            setStep("select");
        }
    }


    async function handleSave() {
        if (!user) return;
        const name = customName.trim() || selectedName;
        if (!name) return;

        setStep("uploading");
        setError(null);
        try {
            // Upload via server-side API route to avoid browser CORS
            let finalImageURL = previewURL ?? "";
            if (file) {
                const uploadForm = new FormData();
                uploadForm.append("file", file);
                uploadForm.append("userId", user.uid);
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadForm,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error);
                finalImageURL = uploadData.url;
            }

            await addPost({
                userId: user.uid,
                userDisplayName: user.displayName ?? "匿名",
                userPhotoURL: user.photoURL ?? "",
                imageURL: finalImageURL,
                flowerName: name,
                latitude: exifLat,
                longitude: exifLng,
                capturedAt,
            });
            setStep("done");
        } catch (err) {
            setError(err instanceof Error ? err.message : "保存に失敗しました");
            setStep("choose");
        }
    }


    return (
        <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="font-serif text-2xl font-bold" style={{ color: "var(--color-brown)" }}>
                    花を記録する
                </h2>
                <div className="divider-ornament mt-2 w-48 mx-auto text-xs text-sepia tracking-widest" />
            </div>

            {/* ---- DONE ---- */}
            {step === "done" && (
                <div className="card-antique p-8 flex flex-col items-center gap-4 text-center">
                    <div className="text-5xl">🌸</div>
                    <p className="font-serif text-lg" style={{ color: "var(--color-brown)" }}>記録が完了しました！</p>
                    <p className="text-sm" style={{ color: "var(--color-sepia)" }}>図鑑と地図に追加されました。</p>
                    <button className="btn-primary mt-2" onClick={reset}>もう一枚記録する</button>
                </div>
            )}

            {/* ---- STEP: SELECT ---- */}
            {(step === "select") && (
                <div className="flex flex-col gap-4">
                    {/* Image picker */}
                    <div
                        className="card-antique flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-colors"
                        style={{ minHeight: 200, borderStyle: "dashed" }}
                        onClick={() => fileRef.current?.click()}
                    >
                        {previewURL ? (
                            <Image
                                src={previewURL}
                                alt="preview"
                                width={300}
                                height={250}
                                className="photo-antique object-cover w-full"
                                style={{ maxHeight: 250 }}
                            />
                        ) : (
                            <>
                                <span className="text-4xl">📷</span>
                                <p className="font-serif text-base" style={{ color: "var(--color-brown-light)" }}>
                                    写真を選択してください
                                </p>
                                <p className="text-xs" style={{ color: "var(--color-sepia)" }}>
                                    タップして選択
                                </p>
                            </>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*,image/heic,image/heif"
                        className="hidden" onChange={handleFileChange} />


                    {/* Exif info */}
                    {previewURL && (
                        <div className="card-antique p-4 flex flex-col gap-2 text-xs" style={{ color: "var(--color-brown-light)" }}>
                            <div className="flex justify-between">
                                <span className="font-serif">📍 位置情報</span>
                                <span>{exifLat ? `${exifLat.toFixed(4)}, ${exifLng?.toFixed(4)}` : "なし"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-serif">📅 撮影日時</span>
                                <span>{capturedAt ? new Date(capturedAt).toLocaleString("ja-JP") : "なし"}</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-center" style={{ color: "#c62828" }}>{error}</p>
                    )}

                    {previewURL && (
                        <button className="btn-primary w-full py-3 text-base" onClick={handleIdentify}>
                            ✨ AIで花を特定する
                        </button>
                    )}
                </div>
            )}

            {/* ---- STEP: CONVERTING ---- */}
            {step === "converting" && (
                <div className="card-antique p-12 flex flex-col items-center gap-4">
                    <div className="spinner" />
                    <p className="font-serif text-base" style={{ color: "var(--color-brown)" }}>
                        HEIC画像を変換中…
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-sepia)" }}>
                        しばらくお待ちください
                    </p>
                </div>
            )}

            {/* ---- STEP: IDENTIFYING ---- */}
            {step === "identifying" && (

                <div className="card-antique p-12 flex flex-col items-center gap-4">
                    <div className="spinner" />
                    <p className="font-serif text-base" style={{ color: "var(--color-brown)" }}>
                        花を特定中…
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-sepia)" }}>
                        GPT-4oが分析しています
                    </p>
                </div>
            )}

            {/* ---- STEP: CHOOSE ---- */}
            {step === "choose" && (
                <div className="flex flex-col gap-5">
                    {previewURL && (
                        <Image
                            src={previewURL}
                            alt="flower"
                            width={400}
                            height={280}
                            className="photo-antique w-full object-cover rounded"
                            style={{ maxHeight: 280 }}
                        />
                    )}
                    <div className="card-antique p-5 flex flex-col gap-4">
                        <p className="font-serif text-base" style={{ color: "var(--color-brown)" }}>
                            花の名前を選択してください
                        </p>
                        <div className="flex flex-col gap-2">
                            {candidates.map((c) => (
                                <label key={c} className="flex items-center gap-3 cursor-pointer p-2 rounded transition-colors"
                                    style={{ backgroundColor: selectedName === c ? "rgba(46,125,50,0.08)" : "transparent" }}>
                                    <input type="radio" name="flower" value={c}
                                        checked={selectedName === c}
                                        onChange={() => { setSelectedName(c); setCustomName(""); }}
                                        className="accent-green-700" />
                                    <span className="font-body text-sm" style={{ color: "var(--color-brown)" }}>{c}</span>
                                </label>
                            ))}
                        </div>
                        <div className="divider-ornament text-xs" style={{ color: "var(--color-sepia)" }}>または手入力</div>
                        <input
                            type="text"
                            className="input-antique"
                            placeholder="別の名前を入力…"
                            value={customName}
                            onChange={(e) => { setCustomName(e.target.value); setSelectedName(""); }}
                        />
                    </div>

                    {/* Exif info */}
                    <div className="card-antique p-4 flex flex-col gap-2 text-xs" style={{ color: "var(--color-brown-light)" }}>
                        <div className="flex justify-between">
                            <span className="font-serif">📍 位置情報</span>
                            <span>{exifLat ? `${exifLat.toFixed(4)}, ${exifLng?.toFixed(4)}` : "なし"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-serif">📅 撮影日時</span>
                            <span>{capturedAt ? new Date(capturedAt).toLocaleString("ja-JP") : "なし"}</span>
                        </div>
                    </div>

                    {error && <p className="text-sm text-center" style={{ color: "#c62828" }}>{error}</p>}

                    <div className="flex gap-3">
                        <button className="btn-secondary flex-1" onClick={reset}>やり直す</button>
                        <button
                            className="btn-primary flex-1"
                            onClick={handleSave}
                            disabled={!selectedName && !customName.trim()}
                        >
                            図鑑に保存する
                        </button>
                    </div>
                </div>
            )}

            {/* ---- STEP: UPLOADING ---- */}
            {step === "uploading" && (
                <div className="card-antique p-12 flex flex-col items-center gap-4">
                    <div className="spinner" />
                    <p className="font-serif text-base" style={{ color: "var(--color-brown)" }}>
                        保存中…
                    </p>
                </div>
            )}
        </div>
    );
}
