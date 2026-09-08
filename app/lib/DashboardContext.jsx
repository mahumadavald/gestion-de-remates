'use client'
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

const DashboardContext = createContext(null);

export function DashboardProvider({ session, children }) {
  const [dbRemates,   setDbRemates]   = useState([]);
  const [dbLotes,     setDbLotes]     = useState([]);
  const [dbPostores,  setDbPostores]  = useState([]);
  const [dbBodegas,   setDbBodegas]   = useState([]);
  const [usuarios,    setUsuarios]    = useState([]);
  const [dbLicencias, setDbLicencias] = useState([]);
  const [dbLoading,   setDbLoading]   = useState(false);
  const [notif,       setNotif]       = useState(null);
  const [remateActivo,      setRemateActivo]      = useState(null);
  const [lotesFiltroRemate, setLotesFiltroRemate] = useState(null);
  const [selectedRemate,    setSelectedRemate]    = useState(null);
  const [salaRemateId,      setSalaRemateId]      = useState(null);

  const notify = (msg, type = "ok") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  // Carga inicial de datos
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      setDbLoading(true);
      try {
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000));
        const lotesQuery = session?.bodegaId
          ? supabase.from("lotes").select("*").eq("bodega_id", session.bodegaId).order("orden")
          : supabase.from("lotes").select("*").order("orden");
        const fetches = Promise.all([
          supabase.from("remates").select("*, casas(slug)").order("created_at", { ascending: false }),
          lotesQuery,
          supabase.from("postores").select("*").order("numero"),
          supabase.from("usuarios").select("*, casas(nombre)").order("nombre"),
          session?.role === "admin"
            ? supabase.from("bodegas").select("*").order("nombre")
            : supabase.from("bodegas").select("*").eq("casa_id", session?.casaId).order("nombre"),
        ]);
        const [remRes, lotRes, posRes, usrRes, bodRes] = await Promise.race([fetches, timeout]);
        if (mounted) {
          if (remRes?.data) setDbRemates(remRes.data);
          if (lotRes?.data) setDbLotes(lotRes.data);
          if (posRes?.data) setDbPostores(posRes.data);
          if (usrRes?.data) setUsuarios(usrRes.data.map(u => ({
            id:       u.id,
            nombre:   u.nombre,
            usuario:  u.email?.split("@")[0] || "",
            email:    u.email,
            roles:    u.roles || [],
            casa:     u.casas?.nombre || "",
            activo:   u.activo,
            bodegaId: u.bodega_id || null,
          })));
          if (bodRes?.data) setDbBodegas(bodRes.data);
        }
      } catch (e) {
        console.warn("Supabase no disponible:", e.message);
      }
      if (mounted) setDbLoading(false);
    };
    cargar();
    return () => { mounted = false; };
  }, [session]);

  // Licencias (solo admin)
  useEffect(() => {
    if (session?.role !== "admin") return;
    supabase.from("casas").select("*").order("nombre").then(({ data }) => {
      if (data) setDbLicencias(data);
    });
  }, [session]);

  // Persistir remate activo
  useEffect(() => {
    try { const s = localStorage.getItem("takka_remate_activo"); if (s) setRemateActivo(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try {
      if (remateActivo) localStorage.setItem("takka_remate_activo", JSON.stringify(remateActivo));
      else localStorage.removeItem("takka_remate_activo");
    } catch {}
  }, [remateActivo]);
  useEffect(() => {
    const id = remateActivo?.supabaseId || remateActivo?.id || null;
    setLotesFiltroRemate(id);
    setSelectedRemate(id);
    if (id) setSalaRemateId(id);
  }, [remateActivo]);

  // Funciones de licencias
  const actualizarLicencia = async (casaId, estado) => {
    const { error } = await supabase.from("casas").update({ licencia_estado: estado }).eq("id", casaId);
    if (!error) {
      setDbLicencias(prev => prev.map(c => c.id === casaId ? { ...c, licencia_estado: estado } : c));
      const label = estado === "activo" ? "activada" : estado === "suspendido" ? "suspendida" : "bloqueada";
      notify(`Licencia ${label}.`, estado === "activo" ? "sold" : "inf");
    }
  };

  const renovarLicencia = async (casaId, fecha) => {
    if (!fecha) return;
    const { error } = await supabase.from("casas").update({ licencia_vence: fecha }).eq("id", casaId);
    if (!error) {
      setDbLicencias(prev => prev.map(c => c.id === casaId ? { ...c, licencia_vence: fecha } : c));
      notify("Fecha de vencimiento actualizada.", "sold");
    }
  };

  const cambiarPlan = async (casaId, plan) => {
    const { error } = await supabase.from("casas").update({ licencia_plan: plan }).eq("id", casaId);
    if (!error) setDbLicencias(prev => prev.map(c => c.id === casaId ? { ...c, licencia_plan: plan } : c));
  };

  const guardarNota = async (casaId, nota) => {
    await supabase.from("casas").update({ notas_admin: nota }).eq("id", casaId);
  };

  const subirLogoCasa = async (casaId, slug, file) => {
    if (!file) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${slug}.${ext}`;
      const { data: upData, error: upErr } = await supabase.storage
        .from("logos").upload(path, file, { upsert: true });
      if (upErr) { notify("Error subiendo logo: " + upErr.message, "inf"); return; }
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const logoUrl = urlData?.publicUrl || null;
      const { error: dbErr } = await supabase.from("casas").update({ logo_url: logoUrl }).eq("id", casaId);
      if (dbErr) { notify("Error guardando logo.", "inf"); return; }
      setDbLicencias(prev => prev.map(c => c.id === casaId ? { ...c, logo_url: logoUrl } : c));
      notify("✓ Logo actualizado.", "sold");
    } catch (e) {
      notify("Error: " + e.message, "inf");
    }
  };

  return (
    <DashboardContext.Provider value={{
      session,
      supabase,
      dbRemates,   setDbRemates,
      dbLotes,     setDbLotes,
      dbPostores,  setDbPostores,
      dbBodegas,   setDbBodegas,
      usuarios,    setUsuarios,
      dbLicencias, setDbLicencias,
      dbLoading,
      notif,       setNotif,
      notify,
      remateActivo,      setRemateActivo,
      lotesFiltroRemate, setLotesFiltroRemate,
      selectedRemate,    setSelectedRemate,
      salaRemateId,      setSalaRemateId,
      actualizarLicencia,
      renovarLicencia,
      cambiarPlan,
      guardarNota,
      subirLogoCasa,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
