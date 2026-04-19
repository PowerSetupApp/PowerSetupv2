"use server";

import { getAISettings } from "@/app/actions/settings";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { specs } = await request.json();

        if (!specs || typeof specs !== "string") {
            return NextResponse.json({ error: "Missing specs text" }, { status: 400 });
        }

        const settings = await getAISettings();

        // Build prompt
        const prompt = settings.specsOptimizationPrompt.replace("{{INPUT}}", specs);

        let optimizedText = "";

        if (settings.provider === "google") {
            const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
            const model = genAI.getGenerativeModel({ model: settings.model });

            const result = await model.generateContent(prompt);
            optimizedText = result.response.text();
        } else {
            const openai = new OpenAI({ apiKey: settings.openaiApiKey });

            const completion = await openai.chat.completions.create({
                model: settings.model,
                messages: [{ role: "user", content: prompt }],
            });

            optimizedText = completion.choices[0]?.message?.content || "";
        }

        return NextResponse.json({ optimizedSpecs: optimizedText.trim() });
    } catch (error) {
        console.error("Specs optimization failed:", error);
        return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
    }
}
