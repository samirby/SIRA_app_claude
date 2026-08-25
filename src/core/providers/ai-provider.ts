export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiProvider {
  code: string;
  generate(input: {
    messages: AiMessage[];
    model?: string;
    organizationId: number;
  }): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }>;
}
