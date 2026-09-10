import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, CircularProgress } from "@wso2/oxygen-ui";
import { handleCallback } from "../auth";

/** The OIDC Authorization Code + PKCE redirect target — `<origin>/callback`. */
export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback()
      .catch(() => undefined)
      .then(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <CircularProgress />
    </Box>
  );
}
