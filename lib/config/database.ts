export type DatabaseProvider = "supabase" | "firebase" | "demo";

export interface DatabaseRuntimeInfo {
  requestedProvider: DatabaseProvider | "auto";
  resolvedProvider: DatabaseProvider;
  providerLabel: string;
  hasSupabaseEnv: boolean;
  hasFirebaseEnv: boolean;
  isCloud: boolean;
  fallbackReason: string | null;
}

const providerLabels: Record<DatabaseProvider, string> = {
  supabase: "Supabase",
  firebase: "Firebase",
  demo: "Demo Local",
};

const getRequestedProvider = (): DatabaseProvider | "auto" => {
  const raw = process.env.NEXT_PUBLIC_DB_PROVIDER;
  if (raw === "supabase" || raw === "firebase" || raw === "demo") return raw;
  return "auto";
};

export const getDatabaseRuntimeInfo = (): DatabaseRuntimeInfo => {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const hasFirebaseEnv =
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  const requestedProvider = getRequestedProvider();

  if (requestedProvider === "supabase") {
    if (hasSupabaseEnv) {
      return {
        requestedProvider,
        resolvedProvider: "supabase",
        providerLabel: providerLabels.supabase,
        hasSupabaseEnv,
        hasFirebaseEnv,
        isCloud: true,
        fallbackReason: null,
      };
    }

    return {
      requestedProvider,
      resolvedProvider: "demo",
      providerLabel: providerLabels.demo,
      hasSupabaseEnv,
      hasFirebaseEnv,
      isCloud: false,
      fallbackReason: "Supabase requested, but credentials are missing.",
    };
  }

  if (requestedProvider === "firebase") {
    return {
      requestedProvider,
      resolvedProvider: "demo",
      providerLabel: providerLabels.demo,
      hasSupabaseEnv,
      hasFirebaseEnv,
      isCloud: false,
      fallbackReason:
        "Firebase mode currently runs through the local compatibility engine to preserve the app's Supabase-shaped API contract.",
    };
  }

  if (requestedProvider === "demo") {
    return {
      requestedProvider,
      resolvedProvider: "demo",
      providerLabel: providerLabels.demo,
      hasSupabaseEnv,
      hasFirebaseEnv,
      isCloud: false,
      fallbackReason: null,
    };
  }

  if (hasSupabaseEnv) {
    return {
      requestedProvider,
      resolvedProvider: "supabase",
      providerLabel: providerLabels.supabase,
      hasSupabaseEnv,
      hasFirebaseEnv,
      isCloud: true,
      fallbackReason: null,
    };
  }

  if (hasFirebaseEnv) {
    return {
      requestedProvider,
      resolvedProvider: "demo",
      providerLabel: providerLabels.demo,
      hasSupabaseEnv,
      hasFirebaseEnv,
      isCloud: false,
      fallbackReason:
        "Firebase credentials found, but the app currently runs via the local compatibility engine until a native Firebase adapter is enabled.",
    };
  }

  return {
    requestedProvider,
    resolvedProvider: "demo",
    providerLabel: providerLabels.demo,
    hasSupabaseEnv,
    hasFirebaseEnv,
    isCloud: false,
    fallbackReason: null,
  };
};

export const resolveDatabaseProvider = (): DatabaseProvider => getDatabaseRuntimeInfo().resolvedProvider;
