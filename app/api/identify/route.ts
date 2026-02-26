import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "file is required" }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "image/jpeg";
        const dataURL = `data:${mimeType};base64,${base64}`;

        // Call OpenAI GPT-4o with the base64 image directly
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `この写真に写っている花を特定し、日本語の一般名（和名）で候補を3つ提案してください。
確信度の高い順に並べ、JSON形式で返してください。
フォーマット: {"candidates": ["候補1", "候補2", "候補3"]}
花以外が写っている場合も、最も可能性の高い植物名で答えてください。`,
                        },
                        {
                            type: "image_url",
                            image_url: { url: dataURL, detail: "high" },
                        },
                    ],
                },
            ],
            max_tokens: 200,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const candidates: string[] = parsed.candidates ?? ["不明な花", "不明な植物", "不明"];

        return NextResponse.json({ candidates });
    } catch (err) {
        console.error("OpenAI identify error:", err);
        return NextResponse.json({ error: "AI識別に失敗しました" }, { status: 500 });
    }
}
