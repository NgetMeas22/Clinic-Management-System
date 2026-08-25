import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import api from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [otpStage, setOtpStage] = useState("email");
  const [otpCode, setOtpCode] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const { login, loginWithToken } = useAuth();
  const { t, localizedPath } = useLocale();
  const navigate = useNavigate();

  useEffect(() => {
    if (!resendIn) return undefined;
    const timer = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, rememberMe);
      navigate(localizedPath("/dashboard"));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/auth/otp/request", { email });
      setOtpStage("code");
      setResendIn(60);
      setOtpCode("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          t("login.otpFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/otp/verify", { email, code: otpCode });
      const { access_token, user } = res.data;
      if (!access_token || !user) throw new Error("missing token");
      loginWithToken(access_token, user);
      navigate(localizedPath("/dashboard"));
    } catch (err) {
      setError(err.response?.data?.message || t("login.otpFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect ទៅ Google OAuth2 Backend Endpoint
  const handleGoogleLogin = () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setOtpStage("email");
    setOtpCode("");
    setResendIn(0);
  };

  return (
    <div className="h-screen bg-slate-100/70 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Language toggle */}
      <div className="fixed top-4 right-4">
        <LanguageSwitcher compact />
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Compact Header */}
        <div className="py-4 px-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm mb-1.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 6h-3V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-2h2v2h-2V4zm3 9h-2v2h-2v-2H8v-2h2V9h2v2h2v2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            NGM<span className="text-blue-600">Clinic</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("login.securePortal")}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800">
              {t("login.welcomeBack")}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "otp" && otpStage === "code"
                ? t("login.otpSentTo", { email })
                : t("login.signInSubtitle")}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-3 bg-red-50 border-l-4 border-red-500 p-2.5 rounded-r-md flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Google OAuth2 Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mb-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 focus:outline-none transition-all shadow-sm flex justify-center items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {t("login.signInWithGoogle")}
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-xs text-slate-400">{t("login.or")}</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Mode tabs */}
          <div className="mt-2 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { key: "otp", label: t("login.tabEmailCode") },
              { key: "password", label: t("login.tabPassword") },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchMode(tab.key)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === tab.key
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "otp" ? (
            /* ---------- Email OTP sign-in ---------- */
            <form
              className="space-y-3 mt-2"
              onSubmit={otpStage === "email" ? requestOtp : verifyOtp}
            >
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("login.workEmail")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@ngmclinic.com"
                    disabled={otpStage === "code"}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Code Field */}
              {otpStage === "code" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t("login.otpCodeLabel")}
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode("otp")}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {t("login.otpChangeEmail")}
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="••••••••"
                    className="w-full py-2 px-3 text-base text-center tracking-[0.5em] rounded-lg border border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    required
                  />
                </div>
              )}

              {/* Send / Verify Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {otpStage === "email" ? t("login.otpSending") : t("login.otpVerifying")}
                  </span>
                ) : (
                  <>
                    {otpStage === "email"
                      ? t("login.otpSendCode")
                      : t("login.otpVerify")}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              {/* Resend */}
              {otpStage === "code" && (
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={resendIn > 0 || isSubmitting}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {resendIn > 0
                      ? t("login.otpResendIn", { seconds: resendIn })
                      : t("login.otpResend")}
                  </button>
                </div>
              )}

              {/* Register Link Footer */}
              <div className="pt-3 mt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  {t("login.needAccount")}{" "}
                  <Link to={localizedPath("/register")} className="font-semibold text-blue-600 hover:text-blue-700">
                    {t("login.registerAsStaff")}
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            /* ---------- Password sign-in ---------- */
            <form className="space-y-3 mt-2" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("login.workEmail")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@ngmclinic.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("login.password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode("otp")}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {t("login.tabEmailCode")}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-600">
                  {t("login.rememberMe")}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("login.signingIn")}
                  </span>
                ) : (
                  <>
                    {t("login.signIn")}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              {/* Register Link Footer */}
              <div className="pt-3 mt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  {t("login.needAccount")}{" "}
                  <Link to={localizedPath("/register")} className="font-semibold text-blue-600 hover:text-blue-700">
                    {t("login.registerAsStaff")}
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
