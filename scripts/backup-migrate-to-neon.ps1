#Requires -Version 5.1
<#
  Dump von Prisma Postgres / jeder Quelle, Restore nach Neon (pg_dump / pg_restore).

  Voraussetzung: PostgreSQL Client Tools (mindestens passend zur Quell-Server-Version; oft PG 16+)
  z. B. https://www.postgresql.org/download/windows/ (nur „Command Line Tools“ reicht) — dann ggf. PATH anpassen.

  Erwartete Umgebungsvariable (eine reicht, Priorität 1-3):
  1) $env:PRISMA_SOURCE_URL
  2) $env:PRISMA_LEGACY_URL
  3) Liest aus .env.local: PRISMA_LEGACY_URL oder DATABASE_URL (nur solange Ziel noch nicht Neon ist)

  Ziel:
  2) $env:NEON_DIRECT_URL
  2) Liest .env.local: DIRECT_URL, falls leer: NEON_URL

  Beispiel:
    $env:PRISMA_SOURCE_URL = "postgresql://..."
    $env:NEON_DIRECT_URL  = "postgresql://...@ep-...eu-central-1.../neondb?sslmode=require&uselibpqcompat=true"
    ./scripts/backup-migrate-to-neon.ps1

  Dump-Datei: backups/powersetup-YYYYMMDD_HHmmss.dump (gitignored: **/*.dump)
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

function Test-PgCommand {
  param([string] $Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Error "Befehl ``$Name`` nicht gefunden. Bitte PostgreSQL-Client (pg_dump, pg_restore, ggf. psql) installieren und PATH setzen. Siehe Kopf dieses Skripts."
  }
}
Test-PgCommand "pg_dump"
Test-PgCommand "pg_restore"

function Get-UrlFromNode {
  $js = @'
const { resolve } = require("node:path");
const { config: load } = require("dotenv");
load({ path: resolve(".env") });
load({ path: resolve(".env.local"), override: true });
const du = process.env.DATABASE_URL;
const a =
  process.env.PRISMA_SOURCE_URL
  || process.env.PRISMA_LEGACY_URL
  || (du && !/neon\.tech/i.test(du) ? du : null);
if (!a) { process.exit(2); }
process.stdout.write(a);
'@
  $out = & node -e $js
  if ($LASTEXITCODE -ne 0 -or -not $out) {
    throw "Quell-URL nicht konfigurierbar: setze PRISMA_SOURCE_URL oder trage in .env.local PRISMA_LEGACY_URL / DATABASE_URL (Altdatenbank) ein."
  }
  return $out.Trim()
}
function Get-NeonDirectFromNode {
  $js = @'
const { resolve } = require("node:path");
const { config: load } = require("dotenv");
load({ path: resolve(".env") });
load({ path: resolve(".env.local"), override: true });
const a = process.env.NEON_DIRECT_URL
  || process.env.DIRECT_URL
  || process.env.NEON_URL
  || "";
if (!a) { process.exit(2); }
process.stdout.write(a);
'@
  $out = & node -e $js
  if ($LASTEXITCODE -ne 0 -or -not $out) { throw "Neon-Ziel-URL fehlt: setze NEON_DIRECT_URL oder DIRECT_URL in .env.local" }
  return $out.Trim()
}

$source = if ($env:PRISMA_SOURCE_URL) { $env:PRISMA_SOURCE_URL.Trim() }
  elseif ($env:PRISMA_LEGACY_URL) { $env:PRISMA_LEGACY_URL.Trim() } else { Get-UrlFromNode }
$dest = if ($env:NEON_DIRECT_URL) { $env:NEON_DIRECT_URL.Trim() } else { Get-NeonDirectFromNode }
if ($source -eq $dest) { throw "Quelle und Ziel sind identisch; Abbruch." }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outPath = Join-Path $root "backups" "powersetup-$stamp.dump"
$null = New-Item -ItemType Directory -Force -Path (Split-Path $outPath -Parent)

Write-Host "pg_dump -> $outPath" -ForegroundColor Cyan
# Verbindung als -d, damit Sonderzeichen in der URL sicherer sind
& pg_dump -Fc --no-owner --no-privileges --verbose -f $outPath -d $source
if ($LASTEXITCODE -ne 0) { throw "pg_dump fehlgeschlagen" }

Write-Host "pg_restore -> Neon (direkter Host)" -ForegroundColor Cyan
& pg_restore --dbname=$dest --no-owner --no-privileges --clean --if-exists --verbose $outPath
if ($LASTEXITCODE -ne 0) { Write-Warning "pg_restore Exitcode: $LASTEXITCODE (einzelne Warnings auf Neon sind normal)" }

Write-Host "Fertig. Dump-Datei: $outPath" -ForegroundColor Green
Write-Host "Dann: DATABASE_URL=Neon-Pooler, DIRECT_URL=Neon-Direct in .env.local setzen, `npx prisma migrate status` " -ForegroundColor Green
