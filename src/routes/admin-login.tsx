import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, intendedRole: "ADMIN" })
      });

      if (!res.ok) {
        throw new Error('Failed to send OTP');
      }

      setStep("OTP");
      setCountdown(30);
      setSuccess("Security code sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, intendedRole: "ADMIN" })
      });

      if (!res.ok) throw new Error("Invalid code");

      const data = await res.json();
      localStorage.setItem("adminToken", data.token || "dummy-admin-token");
      localStorage.setItem("adminEmail", email);
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError("");
    try {
      // 1. Get assertion options from server (now generic)
      const res = await fetch("/api/passkeys/login/start");
      const options = await res.json();

      // 2. Prompt FaceID / TouchID
      const asseResp = await startAuthentication({ optionsJSON: options });

      // 3. Send assertion to server
      const verifyRes = await fetch("/api/passkeys/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asseResp)
      });

      if (!verifyRes.ok) throw new Error("Passkey login failed");

      const data = await verifyRes.json();
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.email || email);
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Passkey");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100">

        <form onSubmit={step === 'EMAIL' ? handleRequestOtp : handleVerifyOtp} className="flex flex-col gap-6">
          <div className="text-center">
            <img src="/homelogo.png" alt="CoachKonnects" className="mx-auto mb-4 h-12 w-auto" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm text-slate-500">Sign in to manage CoachKonnects</p>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 font-bold">{error}</div>}
          {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 font-bold">{success}</div>}

          {step === "EMAIL" ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
                required
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium">Security Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                placeholder="------"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center tracking-[1em] font-mono text-2xl font-black outline-none focus:border-orange-500 focus:bg-white"
                required
              />
              <div className="flex justify-end mt-2 space-x-3">
                <button type="button" onClick={() => { setStep('EMAIL'); setSuccess(''); setError(''); }} className="text-sm text-orange-500 font-bold hover:underline">Edit Email</button>
                <button 
                  type="button" 
                  onClick={handleRequestOtp} 
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-orange-500 font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline"
                >
                  {countdown > 0 ? `Resend (${countdown}s)` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : (step === "EMAIL" ? "Send Code" : "Verify & Login")}
          </button>

          {step === "EMAIL" && (
            <>
              <div className="relative mt-2 flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="mx-4 flex-shrink-0 text-sm font-bold text-slate-400">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handlePasskeyLogin}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Sign in with Passkey
              </button>
            </>
          )} 
        </form>

      </div>
    </div>
  );
}
