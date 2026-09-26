const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

/**
 * Anthropic Messages API를 호출해 JSON 형태의 응답을 받아온다.
 * ANTHROPIC_API_KEY가 설정되지 않은 개발 초기 단계에서는 각 API route가
 * 이 함수 대신 mock 데이터를 반환하도록 되어 있다.
 */
export async function askClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY가 설정되어 있지 않습니다. .env.local을 확인하세요."
    );
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API 오류: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export const hasClaudeKey = () => Boolean(process.env.ANTHROPIC_API_KEY);
