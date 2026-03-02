import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

async function getAccessToken(): Promise<string> {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? "";

    // Fix common Vercel env var issues:
    // 1. Remove surrounding quotes if user accidentally included them
    privateKey = privateKey.replace(/^["']|["']$/g, "");
    // 2. Convert escaped \n to real newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
    // 3. Trim stray whitespace
    privateKey = privateKey.trim();

    if (!privateKey || !clientEmail) {
        throw new Error("Firebase Admin credentials not set in environment variables");
    }

    const auth = new GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey },
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse.token) throw new Error("Failed to obtain access token");
    return tokenResponse.token;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const userId = formData.get("userId") as string | null;

        if (!file || !userId) {
            return NextResponse.json({ error: "file and userId are required" }, { status: 400 });
        }

        const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
        const ext = file.name.split(".").pop() ?? "jpg";
        const objectName = `users/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const mimeType = file.type || "image/jpeg";

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const token = await getAccessToken();

        // Use Firebase Storage REST API — returns download token automatically
        const uploadUrl =
            `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?` +
            `uploadType=media&name=${encodeURIComponent(objectName)}`;

        const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": mimeType,
                "Content-Length": String(buffer.length),
            },
            body: buffer,
        });

        if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            console.error("Firebase Storage upload error:", errBody);
            throw new Error(`Upload failed: ${uploadRes.status}`);
        }

        const uploadData = await uploadRes.json();

        // Build the Firebase Storage download URL (no ACL required)
        const downloadToken = uploadData.downloadTokens;
        const encodedName = encodeURIComponent(objectName);
        const downloadUrl =
            `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodedName}?alt=media&token=${downloadToken}`;

        return NextResponse.json({ url: downloadUrl });
    } catch (err) {
        console.error("Upload error:", err);
        const message = err instanceof Error ? err.message : "アップロードに失敗しました";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
