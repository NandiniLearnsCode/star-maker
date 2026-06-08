const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/convai/conversation";

export function isElevenLabsConfigured() {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID);
}

export async function getElevenLabsConversationToken() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    throw new Error("ElevenLabs voice practice is not configured");
  }

  const url = new URL(`${ELEVENLABS_BASE_URL}/token`);
  url.searchParams.set("agent_id", agentId);
  if (process.env.ELEVENLABS_ENVIRONMENT) {
    url.searchParams.set("environment", process.env.ELEVENLABS_ENVIRONMENT);
  }

  const response = await fetch(url, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to create ElevenLabs conversation token: ${detail || response.statusText}`);
  }

  const body = await response.json() as { token?: string };
  if (!body.token) {
    throw new Error("ElevenLabs did not return a conversation token");
  }

  return body.token;
}
