import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"LOGIN" | "SETUP_2FA" | "VERIFY_2FA">("LOGIN");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [interimToken, setInterimToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  
  const [authCode, setAuthCode] = useState("");
  
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error("Invalid credentials");
      
      const data = await res.json();
      setInterimToken(data.token);
      
      if (data.isSetupRequired) {
        // Fetch QR Code
        const setupRes = await fetch(`/api/admin/auth/2fa/setup?token=${data.token}`);
        const setupData = await setupRes.json();
        setQrCode(setupData.qrCode);
        setStep("SETUP_2FA");
      } else {
        setStep("VERIFY_2FA");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePasskeyLogin = async () => {
    setError("");
    try {
      // 1. Get assertion options from server
      const res = await fetch("/api/admin/passkeys/login/start");
      const options = await res.json();

      // 2. Prompt FaceID / TouchID
      const asseResp = await startAuthentication({ optionsJSON: options });

      // 3. Send assertion to server
      const verifyRes = await fetch("/api/admin/passkeys/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asseResp)
      });

      if (!verifyRes.ok) throw new Error("Passkey login failed");
      
      const data = await verifyRes.json();
      localStorage.setItem("adminToken", data.token);
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Passkey");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: interimToken, code: authCode })
      });
      if (!res.ok) throw new Error("Invalid code");
      
      const data = await res.json();
      localStorage.setItem("adminToken", data.token);
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
        
        {step === "LOGIN" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="text-center">
              <img src="/homelogo.png" alt="CoachKonnects" className="mx-auto mb-4 h-12 w-auto" />
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-sm text-slate-500">Sign in to manage CoachKonnects</p>
            </div>
            
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
            >
              Continue
            </button>
            
            <div className="relative mt-2 flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="mx-4 flex-shrink-0 text-sm text-slate-400">or</span>
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
          </form>
        )}

        {step === "SETUP_2FA" && (
          <div className="flex flex-col">
            <button onClick={() => setStep("LOGIN")} className="mb-6 self-start text-slate-400 hover:text-slate-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="mb-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-medium text-slate-800 mb-2">Scan this QR code</h1>
              <p className="text-base text-slate-600">
                Download the Google Authenticator app on your new device. Within the app, scan this QR code.
              </p>
            </div>
            
            <div className="mx-auto mb-8 aspect-square w-[250px] overflow-hidden rounded-2xl bg-white p-2">
              <img src={qrCode} alt="QR Code" className="h-full w-full object-contain" />
            </div>

            <button
              onClick={() => setStep("VERIFY_2FA")}
              className="self-end rounded-full bg-[#465f90] px-8 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#354870]"
            >
              Next
            </button>
          </div>
        )}

        {step === "VERIFY_2FA" && (
          <form onSubmit={handleVerify} className="flex flex-col gap-6">
             <button type="button" onClick={() => setStep("LOGIN")} className="mb-2 self-start text-slate-400 hover:text-slate-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="text-left">
              <h1 className="text-2xl font-bold mb-2">Enter Verification Code</h1>
              <p className="text-sm text-slate-500">Enter the 6-digit code from Google Authenticator.</p>
            </div>
            
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            
            <div>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold tracking-widest outline-none focus:border-orange-500 focus:bg-white"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 rounded-full bg-[#465f90] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#354870]"
            >
              Verify & Login
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
