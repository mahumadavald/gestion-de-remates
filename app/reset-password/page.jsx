'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPA_URL ? createClient(SUPA_URL, SUPA_KEY) : null;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --ac:#06B6D4; --gr:#14B8A6; --rd:#ef4444; --b1:#e5e7eb; --b2:#d1d5db; --wh:#1a1a1a; --mu:#6b7280; --s2:#ffffff; --font:'Inter',sans-serif; --head:'Poppins', sans-serif; }
  html, body { min-height: 100vh; background: #f4f4f2; font-family: var(--font); display: flex; align-items: center; justify-content: center; }
  .wrap { width: 100%; max-width: 420px; margin: 2rem auto; padding: 0 1.25rem; }
  .card { background: var(--s2); border: 1px solid var(--b1); border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 24px rgba(0,0,0,.06); }
  .logo { display: flex; align-items: center; gap: .6rem; margin-bottom: 2rem; }
  .title { font-family: var(--head); font-size: 1.45rem; font-weight: 800; color: var(--wh); letter-spacing: -.02em; margin-bottom: .4rem; }
  .sub { font-size: .88rem; color: var(--mu); margin-bottom: 1.75rem; line-height: 1.6; }
  .field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1rem; }
  .label { font-size: .75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: .06em; }
  .input { padding: .8rem 1rem; background: var(--s2); border: 1.5px solid var(--b1); border-radius: 9px; color: var(--wh); font-family: var(--font); font-size: .9rem; outline: none; transition: border .15s; }
  .input:focus { border-color: var(--ac); }
  .input.err { border-color: var(--rd); }
  .btn { width: 100%; padding: .9rem; background: linear-gradient(135deg,#06B6D4,#14B8A6); border: none; border-radius: 10px; color: #fff; font-family: var(--font); font-size: .95rem; font-weight: 700; cursor: pointer; transition: all .2s; margin-top: .5rem; }
  .btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .err-msg { background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: .7rem .9rem; font-size: .83rem; color: var(--rd); margin-bottom: 1rem; }
  .success-wrap { text-align: center; padding: 1rem 0; }
  .success-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(20,184,166,.1); border: 2px solid rgba(20,184,166,.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
  .success-title { font-family: var(--head); font-size: 1.25rem; font-weight: 800; color: var(--wh); margin-bottom: .5rem; }
  .success-sub { font-size: .88rem; color: var(--mu); line-height: 1.6; }
  .hint { font-size: .73rem; color: var(--mu); margin-top: .35rem; }
`;

export default function ResetPasswordPage() {
  const [ready,    setReady]    = useState(false); // token recibido
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    // Supabase detecta el token de recovery desde el hash de la URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm)  { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updErr) {
      setError(updErr.message || "No se pudo actualizar la contraseña. Intenta solicitar un nuevo enlace.");
      return;
    }

    setDone(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 3000);
  };

  return (
    <div>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="card">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <path d="M8 12 Q8 7 14 7 L22 7 Q30 7 30 14 Q30 19 24 20 L30 28" stroke="#38B2F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 12 Q4 5 12 5 L20 5" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{fontWeight:700,fontSize:".88rem",color:"#374151",letterSpacing:"-.01em"}}>Pecker</span>
          </div>

          {done ? (
            <div className="success-wrap">
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round"><path d="M5 14l7 7 11-13"/></svg>
              </div>
              <div className="success-title">Contraseña actualizada</div>
              <div className="success-sub">Tu contraseña fue cambiada exitosamente.<br/>Serás redirigido al inicio de sesión en unos segundos.</div>
            </div>
          ) : !ready ? (
            <>
              <div className="title">Enlace inválido</div>
              <div className="sub">Este enlace de recuperación no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.</div>
              <a href="/dashboard" style={{display:"block",textAlign:"center",padding:".8rem",background:"linear-gradient(135deg,#06B6D4,#14B8A6)",color:"#fff",borderRadius:10,fontWeight:700,fontSize:".9rem",textDecoration:"none",marginTop:".5rem"}}>
                Ir al inicio de sesión
              </a>
            </>
          ) : (
            <>
              <div className="title">Nueva contraseña</div>
              <div className="sub">Elige una contraseña segura para tu cuenta de postor.</div>

              {error && <div className="err-msg">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label className="label">Nueva contraseña</label>
                  <input
                    className={`input${error&&password.length<8?" err":""}`}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    autoFocus
                  />
                  <div className="hint">Mínimo 8 caracteres. Usa letras y números.</div>
                </div>
                <div className="field">
                  <label className="label">Confirmar contraseña</label>
                  <input
                    className={`input${error&&password!==confirm?" err":""}`}
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={e=>setConfirm(e.target.value)}
                  />
                </div>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Actualizando..." : "Cambiar contraseña →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
