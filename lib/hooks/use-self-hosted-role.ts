"use client";

import { useEffect, useMemo, useState } from "react";
import { deployment } from "@/lib/config/deployment";
import type { OnboardingRole } from "@/lib/config/onboarding";
import { createClient } from "@/utils/supabase/client";

interface SelfHostedRoleState {
  loading: boolean;
  isAuthenticated: boolean;
  role: OnboardingRole;
}

const defaultState: SelfHostedRoleState = {
  loading: false,
  isAuthenticated: false,
  role: "guest",
};

/**
 * Resolves role context for self-hosted onboarding.
 * The role comes from server-side RPC and is used only for UI branching.
 */
export function useSelfHostedRole(): SelfHostedRoleState {
  const [state, setState] = useState<SelfHostedRoleState>(() => {
    if (!deployment.isSelfHosted) return defaultState;
    return { loading: true, isAuthenticated: false, role: "guest" };
  });

  const supabase = useMemo(() => {
    if (!deployment.isSelfHosted) return null;
    return createClient();
  }, []);

  useEffect(() => {
    if (!deployment.isSelfHosted || !supabase) return;

    let isCancelled = false;

    const loadRole = async () => {
      const userResult = await supabase.auth.getUser();
      const user = userResult.data.user;

      if (!user) {
        if (!isCancelled) {
          setState({ loading: false, isAuthenticated: false, role: "guest" });
        }
        return;
      }

      const roleResult = await supabase.rpc("bootstrap_user_role", { p_user_id: user.id });
      const role = roleResult.error
        ? "member"
        : roleResult.data === "admin"
          ? "admin"
          : "member";

      if (!isCancelled) {
        setState({
          loading: false,
          isAuthenticated: true,
          role,
        });
      }
    };

    void loadRole();

    return () => {
      isCancelled = true;
    };
  }, [supabase]);

  return state;
}
