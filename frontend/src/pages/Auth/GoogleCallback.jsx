import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken, user, token } = useAuth();
  const { t, localizedPath } = useLocale();
  const [stored, setStored] = useState(false);

  const tokenFromUrl = searchParams.get("token");
  const hasError = searchParams.get("error");

  useEffect(() => {
    if (tokenFromUrl) {
      loginWithToken(tokenFromUrl);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the token as persisted
      setStored(true);
    }
  }, [tokenFromUrl, loginWithToken]);

  if (hasError || !tokenFromUrl || (!user && !token && stored)) {
    return <Navigate to={localizedPath("/login")} replace />;
  }

  if (user) {
    return <Navigate to={localizedPath("/dashboard")} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600" />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {t("auth.googleSigningIn")}
      </p>
    </div>
  );
}
