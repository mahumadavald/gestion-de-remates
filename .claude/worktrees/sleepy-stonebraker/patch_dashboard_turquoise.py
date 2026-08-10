#!/usr/bin/env python3
"""
Aplica el cambio de paleta de colores al Dashboard.jsx
De: fondo oscuro (#0d1117) 
A:  fondo blanco/turquesa (#f4f4f2 + #06B6D4)

Uso: python3 patch_dashboard_turquoise.py
Debe ejecutarse desde la raíz del proyecto (donde está app/)
"""

import os, shutil

TARGET = "app/Dashboard.jsx"

if not os.path.exists(TARGET):
    print(f"❌ No se encontró {TARGET}")
    print("   Asegúrate de ejecutar desde la raíz del proyecto.")
    exit(1)

# Backup
shutil.copy(TARGET, TARGET + ".bak")
print(f"✓ Backup creado: {TARGET}.bak")

with open(TARGET, "r", encoding="utf-8") as f:
    src = f.read()

original_len = len(src)

PATCHES = [
    # ── :root variables ──
    (
        """:root{
  --bg:#0d1117;
  --s1:#1F2937;
  --s2:#243447;
  --s3:#2a3d52;
  --b1:#2d4060;
  --b2:#364d70;
  --ac:#38B2F6;
  --acH:#5ec4f8;
  --acD:#1a8fd4;
  --wh:#ffffff;
  --wh2:#e8f4fe;
  --mu:#5a7fa8;
  --mu2:#7aaec8;
  --gr:#14B8A6;
  --rd:#f56565;
  --yl:#f6ad55;
}
html,body{height:100%;background:var(--bg);color:var(--wh2);font-family:'Inter',sans-serif;overflow:hidden;font-size:16px;}""",
        """:root{
  --bg:#f4f4f2;
  --s1:#f4f4f2;
  --s2:#ffffff;
  --s3:#f0f0ef;
  --b1:#e5e7eb;
  --b2:#d1d5db;
  --ac:#06B6D4;
  --acH:#22d3ee;
  --acD:#0284C7;
  --wh:#1a1a1a;
  --wh2:#1a1a1a;
  --mu:#6b7280;
  --mu2:#4b5563;
  --gr:#0d9488;
  --rd:#dc2626;
  --yl:#d97706;
}
html,body{height:100%;background:#f4f4f2;color:#1a1a1a;font-family:'Inter',sans-serif;overflow:hidden;font-size:16px;}"""
    ),
    # ── scrollbar track ──
    ("::-webkit-scrollbar-track{background:transparent;}", "::-webkit-scrollbar-track{background:#f4f4f2;}"),
    ("::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px;}", "::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px;}"),
    # ── overlay modal ──
    (".ov{position:fixed;inset:0;background:rgba(0,0,0,.78);", ".ov{position:fixed;inset:0;background:rgba(0,0,0,.45);"),
    # ── tooltip chart ──
    (".ctt{background:var(--s3)!important;border:1px solid var(--b2)!important;border-radius:7px;padding:.42rem .7rem;font-size:.68rem;color:var(--wh2);}",
     ".ctt{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:7px;padding:.42rem .7rem;font-size:.68rem;color:#1a1a1a;box-shadow:0 2px 8px rgba(0,0,0,.08);}"),
    # ── tabla hover ──
    ("tr:hover td{background:rgba(56,178,246,.04);}", "tr:hover td{background:rgba(6,182,212,.04);}"),
    # ── th background ──
    ("background:rgba(255,255,255,.01);}", "background:rgba(0,0,0,.01);}"),
    # ── notif ──
    (".notif.ok  {background:rgba(20,184,166,.12);border:1px solid rgba(20,184,166,.35);color:var(--gr);}",
     ".notif.ok  {background:#f0fdf4;border:1px solid rgba(13,148,136,.35);color:var(--gr);}"),
    (".notif.sold{background:rgba(56,178,246,.14);border:1px solid rgba(56,178,246,.38);color:var(--ac);}",
     ".notif.sold{background:#e0f7fb;border:1px solid rgba(6,182,212,.38);color:var(--ac);}"),
    (".notif.inf {background:rgba(56,178,246,.12);border:1px solid rgba(56,178,246,.3);color:var(--acH);}",
     ".notif.inf {background:#e0f7fb;border:1px solid rgba(6,182,212,.3);color:var(--ac);}"),
    # ── GRLogo stroke white → dark ──
    ('stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>', 'stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" fill="none"/>'),
    # ── Bar chart color ──
    ('fill="#38B2F6" radius={[4,4,0,0]}', 'fill="#06B6D4" radius={[4,4,0,0]}'),
    # ── PIE_COLORS ──
    ('const PIE_COLORS = ["#38B2F6","#34d399","#f6ad55"];', 'const PIE_COLORS = ["#06B6D4","#0d9488","#d97706"];'),
]

applied = 0
for old, new in PATCHES:
    if old in src:
        src = src.replace(old, new, 1)
        applied += 1
    else:
        print(f"  ⚠ No encontrado: '{old[:60].strip()}'")

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(src)

print(f"\n✅ Dashboard actualizado — {applied}/{len(PATCHES)} patches aplicados")
print(f"   Archivo: {TARGET} ({len(src):,} chars)")
print(f"\nLuego haz:")
print("  git add . && git commit -m 'dashboard fondo blanco turquesa' && git push")
