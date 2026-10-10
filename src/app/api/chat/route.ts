import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// レスポンスのストリーミングを最大30秒まで許可
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // v7のUIMessage形式(parts)をCoreMessage形式(content)にマッピングする
    const coreMessages = messages.map((m: any) => ({
        role: m.role,
        content: m.content || (m.parts ? m.parts.map((p: any) => p.text || '').join('') : '')
    }));

    const result = streamText({
        // TODO: システムプロンプトやユーザープロンプトに表示中の分析結果を組み込めるようにする
        model: openai('gpt-4o-mini'), // コストパフォーマンスの良いモデルを指定
        system: "あなたは大学のシラバスやカリキュラム分析をサポートする優秀なAIアシスタントです。ユーザーの文脈に合わせて端的に回答してください。",
        messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
}
