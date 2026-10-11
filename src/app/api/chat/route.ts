import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// レスポンスのストリーミングを最大30秒まで許可
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    // v7のUIMessage形式(parts)をCoreMessage形式(content)にマッピングする
    const coreMessages = messages.map((m: any) => ({
        role: m.role,
        content: m.content || (m.parts ? m.parts.map((p: any) => p.text || '').join('') : '')
    }));

    let systemPrompt = `あなたは大学のシラバスやカリキュラム分析を専門とする高度なAIアシスタント「CurricuLens Agent」です。
大学教員、FD担当者、カリキュラム設計者からの質問に対し、専門的かつ実践的な示唆をわかりやすく日本語で回答してください。`;

    if (context && (context.pageTitle || context.primaryTarget || context.details)) {
        systemPrompt += `\n\n========================================
【現在ユーザーが閲覧中の分析画面コンテキスト】
・分析機能: ${context.pageTitle || '分析画面'}
${context.primaryTarget ? `・基準対象（学科等）: ${context.primaryTarget}\n` : ''}${context.compareTarget ? `・比較対象（学科等）: ${context.compareTarget}\n` : ''}${context.summaryText ? `・概要: ${context.summaryText}\n` : ''}`;

        if (context.details) {
            systemPrompt += `・詳細分析データ:\n${JSON.stringify(context.details, null, 2)}\n`;
        }

        systemPrompt += `========================================
【回答ガイドライン】
1. 上記の画面コンテキストに記載された具体的な学科名、スキル項目名、比率（%）、スコア、順位などの数値を積極的に根拠として引用してください。
2. 知識関連スキル（A群）と汎用スキル（B群）のバランスや特性に着目して分析してください。
3. 学科間の比較では、各学科の教育目的や専門分野の特性を踏まえた多面的な教育改善示唆を提供してください。
4. Markdownで見やすく構造化（見出し、箇条書き、太字など）して回答してください。`;
    }

    const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
}
