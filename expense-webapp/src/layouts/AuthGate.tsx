import { useEffect, useState, type JSX, type ReactNode } from "react";
import { Box, CircularProgress } from "@wso2/oxygen-ui";
import { currentUser, signIn } from "../auth";

/**
 * Gates every signed-in screen behind Thunder SSO: an unauthenticated visitor
 * is redirected to sign-in before any expense data renders — no dashboard
 * preview. `currentUser()` renews an expired session silently and only
 * returns null when there is truly no session to resume.
 */
export default function AuthGate({ children }: { children: ReactNode }): JSX.Element {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void currentUser().then((user) => {
      if (cancelled) return;
      if (user) {
        setAuthed(true);
      } else {
        void signIn();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authed) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
