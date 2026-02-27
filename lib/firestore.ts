import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface FlowerPost {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL: string;
    imageURL: string;
    flowerName: string;
    latitude: number | null;
    longitude: number | null;
    capturedAt: string | null; // ISO string from Exif
    createdAt: Timestamp | null;
}

// Each community deployment gets its own isolated Firestore collection.
// Set NEXT_PUBLIC_COMMUNITY_ID in Vercel env vars (e.g. "sakura-circle").
// If unset, falls back to "posts" for backward compatibility.
const communityId = process.env.NEXT_PUBLIC_COMMUNITY_ID || "";
const COLLECTION = communityId ? `posts_${communityId}` : "posts";


/** Subscribe to all posts ordered by creation time (newest first) */
export function subscribePosts(callback: (posts: FlowerPost[]) => void) {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<FlowerPost, "id">),
        }));
        callback(posts);
    });
}

/** Add a new flower post */
export async function addPost(
    data: Omit<FlowerPost, "id" | "createdAt">
): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

/** Update only the flower name of a post */
export async function updatePostName(id: string, flowerName: string) {
    await updateDoc(doc(db, COLLECTION, id), { flowerName });
}

/** Delete a post document */
export async function deletePost(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
}
