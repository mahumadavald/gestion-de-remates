#!/usr/bin/env python3
"""
GR Auction Software — Turquoise Color Patch
Aplica la paleta turquesa (#06B6D4) a todos los archivos del proyecto.

USO:
  python3 apply_turquoise.py

Modifica estos archivos en tu proyecto:
  app/Dashboard.jsx
  app/LandingPage.jsx
  app/display/[slug]/page.jsx
  app/participar/[slug]/page.jsx

Ejecuta desde la raíz del proyecto (donde está la carpeta app/).
"""
import os, re, sys

# ── Mapa de reemplazos ──────────────────────────────────────────
REPLACEMENTS = [
    # CSS Variables
    ("--ac:#38B2F6",    "--ac:#06B6D4"),
    ("--acH:#5ec4f8",   "--acH:#22d3ee"),
    ("--acD:#1a8fd4",   "--acD:#0284C7"),
    ("--acL:  #5ec4f8", "--acL:  #22d3ee"),
    ("--acL: #5ec4f8",  "--acL: #22d3ee"),
    ("--blue:#38B2F6",  "--blue:#06B6D4"),
    ("--primary:#38B2F6","--primary:#06B6D4"),
    # Hex literals
    ("#38B2F6", "#06B6D4"),
    ("#5ec4f8", "#22d3ee"),
    ("#5EC4F8", "#22D3EE"),
    ("#1a8fd4", "#0284C7"),
    ("#1a6fd4", "#0284C7"),
    ("#1d6fd8", "#0284C7"),
    ("#38b2f6", "#06b6d4"),
    ("#2F80ED", "#06B6D4"),
    # PDF color tuples
    ("[47,128,237]",             "[6,182,212]"),
    ("C_PRIMARY= [56, 178, 246]","C_PRIMARY= [6, 182, 212]"),
    ("rgba(47,128,237,",         "rgba(6,182,212,"),
    # rgba(56,178,246, ...) — todos los valores de opacidad
    ("rgba(56,178,246,.02)", "rgba(6,182,212,.02)"),
    ("rgba(56,178,246,.03)", "rgba(6,182,212,.03)"),
    ("rgba(56,178,246,.04)", "rgba(6,182,212,.04)"),
    ("rgba(56,178,246,.05)", "rgba(6,182,212,.05)"),
    ("rgba(56,178,246,.06)", "rgba(6,182,212,.06)"),
    ("rgba(56,178,246,.07)", "rgba(6,182,212,.07)"),
    ("rgba(56,178,246,.08)", "rgba(6,182,212,.08)"),
    ("rgba(56,178,246,.09)", "rgba(6,182,212,.09)"),
    ("rgba(56,178,246,.1)",  "rgba(6,182,212,.1)"),
    ("rgba(56,178,246,.12)", "rgba(6,182,212,.12)"),
    ("rgba(56,178,246,.14)", "rgba(6,182,212,.14)"),
    ("rgba(56,178,246,.15)", "rgba(6,182,212,.15)"),
    ("rgba(56,178,246,.18)", "rgba(6,182,212,.18)"),
    ("rgba(56,178,246,.2)",  "rgba(6,182,212,.2)"),
    ("rgba(56,178,246,.25)", "rgba(6,182,212,.25)"),
    ("rgba(56,178,246,.28)", "rgba(6,182,212,.28)"),
    ("rgba(56,178,246,.3)",  "rgba(6,182,212,.3)"),
    ("rgba(56,178,246,.35)", "rgba(6,182,212,.35)"),
    ("rgba(56,178,246,.38)", "rgba(6,182,212,.38)"),
    ("rgba(56,178,246,.4)",  "rgba(6,182,212,.4)"),
    # rgba con decimales (0.x)
    ("rgba(56,178,246,0.06)", "rgba(6,182,212,0.06)"),
    ("rgba(56,178,246,0.08)", "rgba(6,182,212,0.08)"),
    ("rgba(56,178,246,0.1)",  "rgba(6,182,212,0.1)"),
    ("rgba(56,178,246,0.12)", "rgba(6,182,212,0.12)"),
    ("rgba(56,178,246,0.15)", "rgba(6,182,212,0.15)"),
    ("rgba(56,178,246,0.2)",  "rgba(6,182,212,0.2)"),
    ("rgba(56,178,246,0.25)", "rgba(6,182,212,0.25)"),
    ("rgba(56,178,246,0.3)",  "rgba(6,182,212,0.3)"),
    ("rgba(56,178,246,0.35)", "rgba(6,182,212,0.35)"),
]

FILES = [
    "app/Dashboard.jsx",
    "app/LandingPage.jsx",
    "app/display/[slug]/page.jsx",
    "app/participar/[slug]/page.jsx",
]

def apply(content):
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    return content

def process_file(path):
    if not os.path.exists(path):
        print(f"  ⚠  No encontrado: {path}")
        return
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    updated = apply(original)
    if updated == original:
        print(f"  ✓  Sin cambios: {path}")
        return
    # Backup
    with open(path + ".bak", "w", encoding="utf-8") as f:
        f.write(original)
    with open(path, "w", encoding="utf-8") as f:
        f.write(updated)
    # Count remaining blue
    remaining = len(re.findall(r'#38B2F6|rgba\(56,178,246', updated, re.IGNORECASE))
    print(f"  ✅ Actualizado: {path}  (refs azules restantes: {remaining})")

print("=" * 56)
print("  GR Auction Software — Turquoise Patch v1.0")
print("=" * 56)
print()

for f in FILES:
    process_file(f)

print()
print("Listo. Los archivos originales están en *.bak")
print("Vercel redesplegará automáticamente al hacer commit.")
