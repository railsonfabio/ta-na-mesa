# ==============================================================================
# TÁ NA MESA (by A2i Solutions & Alô Classificados)
# SCRIPT DE AUTOMAÇÃO DE DEPLOY COMPLETO (GITHUB + SUPABASE + VERCEL + DOMÍNIO)
# ==============================================================================
param(
  [string]$GitHubRepoUrl = "https://github.com/railsonfabio/ta-na-mesa.git",
  [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
  [string]$SupabaseAnonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY,
  [string]$SupabaseServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$DefaultStoreId = "00000000-0000-0000-0000-000000000001",
  [string]$PixWebhookSecret = "a2i-tanamesa-pix-secret-2026",
  [string]$CustomDomain = "tanamesa.a2isolutions.com.br"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " 1/4 - SINCRONIZAÇÃO COM O GITHUB (branch main)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

git remote set-url origin $GitHubRepoUrl
git push -u origin main

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 2/4 - CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE NA VERCEL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

npx vercel link --yes

if ($SupabaseUrl) {
  $SupabaseUrl | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
}
if ($SupabaseAnonKey) {
  $SupabaseAnonKey | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
}
if ($SupabaseServiceRoleKey) {
  $SupabaseServiceRoleKey | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --force
}
$DefaultStoreId | npx vercel env add NEXT_PUBLIC_DEFAULT_STORE_ID production --force
$PixWebhookSecret | npx vercel env add PIX_WEBHOOK_SECRET production --force

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 3/4 - BUILD E DEPLOY DE PRODUÇÃO NA VERCEL (Região gru1)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

npx vercel --prod --yes

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 4/4 - APONTAMENTO DO SUBDOMÍNIO OFICIAL ($CustomDomain)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

npx vercel domains add $CustomDomain

Write-Host "`n✅ Deploy de produção concluído com sucesso!" -ForegroundColor Green
