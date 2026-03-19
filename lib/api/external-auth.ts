import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const safeEquals = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const hasScope = (granted: string[], required: string) => {
  if (granted.includes(required)) return true;
  if (granted.includes("api:v1")) return true;
  if (required.startsWith("api:v1:") && granted.includes("api:v1:*")) return true;
  return false;
};

export type ExternalApiAuthContext = {
  authorized: true;
  authType: "legacy_token" | "integration_key";
  scopes: string[];
  keyId?: string;
  userId?: string | null;
};

export const getBearerToken = async (): Promise<string | null> => {
  const headerStore = await headers();
  const auth = headerStore.get("authorization");
  if (!auth) return null;
  const [scheme, value] = auth.split(" ");
  if (!scheme || !value) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  const token = value.trim();
  if (token.length < 16 || token.length > 512) return null;
  return token;
};

const validateLegacyEnvToken = (token: string) => {
  const expected = process.env.EXTERNAL_SYNC_TOKEN;
  if (!expected || expected.length < 16) return false;
  return safeEquals(expected, token);
};

type IntegrationKeyRecord = {
  id: string;
  key_hash: string;
  is_active: boolean;
  expires_at: string | null;
  scopes?: string[] | null;
  user_id?: string | null;
};

const fetchIntegrationKey = async (tokenHash: string): Promise<IntegrationKeyRecord | null> => {
  const supabase = await createClient();

  const fullResult = await supabase
    .from("integration_keys")
    .select("id,key_hash,is_active,expires_at,scopes,user_id")
    .eq("key_hash", tokenHash)
    .eq("is_active", true)
    .maybeSingle();

  if (!fullResult.error) {
    return (fullResult.data as IntegrationKeyRecord | null) ?? null;
  }

  if (!/column .* does not exist/i.test(fullResult.error.message)) {
    return null;
  }

  const fallbackResult = await supabase
    .from("integration_keys")
    .select("id,key_hash,is_active,expires_at")
    .eq("key_hash", tokenHash)
    .eq("is_active", true)
    .maybeSingle();

  if (fallbackResult.error) return null;
  return (fallbackResult.data as IntegrationKeyRecord | null) ?? null;
};

const validateIntegrationKeyFromDb = async (token: string): Promise<ExternalApiAuthContext | null> => {
  const tokenHash = sha256(token);
  const data = await fetchIntegrationKey(tokenHash);

  if (!data) return null;

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  const supabase = await createClient();
  await supabase
    .from("integration_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return {
    authorized: true,
    authType: "integration_key",
    scopes: Array.isArray(data.scopes) && data.scopes.length > 0 ? data.scopes : ["api:v1"],
    keyId: data.id,
    userId: data.user_id ?? null,
  };
};

export const authorizeExternalApi = async (
  requiredScope = "api:v1"
): Promise<ExternalApiAuthContext | null> => {
  const token = await getBearerToken();
  if (!token) return null;

  if (validateLegacyEnvToken(token)) {
    return {
      authorized: true,
      authType: "legacy_token",
      scopes: ["api:v1", "api:v1:*"],
    };
  }

  try {
    const context = await validateIntegrationKeyFromDb(token);
    if (!context) return null;
    if (!hasScope(context.scopes, requiredScope)) return null;
    return context;
  } catch {
    return null;
  }
};

export const isExternalApiAuthorized = async (): Promise<boolean> => {
  const context = await authorizeExternalApi("api:v1");
  return Boolean(context?.authorized);
};
