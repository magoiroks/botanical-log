"use client";

import { useEffect, useState } from "react";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";
import { subscribePosts, FlowerPost } from "@/lib/firestore";
import Image from "next/image";

const MAP_CONTAINER_STYLE = { width: "100%", height: "calc(100dvh - 116px)" };
const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }; // Tokyo
const MAP_STYLES = [
    { elementType: "geometry", stylers: [{ color: "#f5f1e8" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#5c4a37" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e8" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c4a880" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#ae9a7e" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#93817c" }] },
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5b076" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#447530" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#f8f4e8" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fdfbe7" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f3d19c" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#806b63" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
    { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#b9d3c2" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#92998d" }] },
];

export default function MapPage() {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    });
    const [posts, setPosts] = useState<FlowerPost[]>([]);
    const [selected, setSelected] = useState<FlowerPost | null>(null);
    const [center, setCenter] = useState(DEFAULT_CENTER);

    // Try to center map on user's current GPS position
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { } // fall back to DEFAULT_CENTER
            );
        }
    }, []);

    useEffect(() => {
        const unsubscribe = subscribePosts(setPosts);
        return unsubscribe;
    }, []);

    if (loadError) return (
        <div className="flex items-center justify-center h-full p-8 text-center">
            <p className="font-serif text-brown">地図の読み込みに失敗しました。<br />APIキーを確認してください。</p>
        </div>
    );
    if (!isLoaded) return (
        <div className="flex items-center justify-center h-full">
            <div className="spinner" />
        </div>
    );

    const postsWithLocation = posts.filter((p) => p.latitude && p.longitude);

    return (
        <div className="relative">
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                zoom={14}
                center={center}
                options={{
                    mapTypeId: "hybrid",
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                }}
                onClick={() => setSelected(null)}
            >

                {postsWithLocation.map((post) => (
                    <OverlayView
                        key={post.id}
                        position={{ lat: post.latitude!, lng: post.longitude! }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <button
                            className="flex flex-col items-center cursor-pointer group"
                            onClick={(e) => { e.stopPropagation(); setSelected(post); }}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 shadow-md transition-transform group-hover:scale-110"
                                style={{ borderColor: "var(--color-brown)", boxShadow: "0 2px 6px rgba(62,39,35,0.4)" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={post.imageURL} alt={post.flowerName} width={40} height={40}
                                    className="object-cover w-full h-full" style={{ filter: "sepia(15%)" }} />

                            </div>
                            <div className="mt-1 px-2 py-0.5 rounded text-xs font-serif shadow"
                                style={{
                                    backgroundColor: "rgba(245,245,220,0.9)", color: "var(--color-brown)",
                                    border: "1px solid rgba(62,39,35,0.3)"
                                }}>
                                {post.flowerName}
                            </div>
                            {/* pin stem */}
                            <div className="w-0.5 h-2" style={{ backgroundColor: "var(--color-brown)" }} />
                        </button>
                    </OverlayView>
                ))}
            </GoogleMap>

            {/* Detail popup */}
            {selected && (
                <div className="absolute bottom-4 left-4 right-4 card-antique p-4 flex gap-4 animate-fade-in z-20">
                    <Image
                        src={selected.imageURL}
                        alt={selected.flowerName}
                        width={80}
                        height={80}
                        className="photo-antique object-cover rounded shrink-0"
                        style={{ width: 80, height: 80 }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg font-bold truncate" style={{ color: "var(--color-brown)" }}>
                            {selected.flowerName}
                        </p>
                        {selected.capturedAt && (
                            <p className="text-xs mt-1" style={{ color: "var(--color-sepia)" }}>
                                📅 {new Date(selected.capturedAt).toLocaleDateString("ja-JP")}
                            </p>
                        )}
                        {selected.latitude && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-sepia)" }}>
                                🗺 {selected.latitude.toFixed(4)}, {selected.longitude!.toFixed(4)}
                            </p>
                        )}

                    </div>
                    <button onClick={() => setSelected(null)} className="shrink-0 text-lg leading-none"
                        style={{ color: "var(--color-sepia)" }}>✕</button>
                </div>
            )}

            {postsWithLocation.length === 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 card-antique px-4 py-2 text-sm font-serif"
                    style={{ color: "var(--color-brown-light)" }}>
                    まだ位置情報付きの投稿がありません
                </div>
            )}
        </div>
    );
}
