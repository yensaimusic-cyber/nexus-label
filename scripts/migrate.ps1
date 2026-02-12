# Script PowerShell pour exécuter les migrations SQL automatiquement
# Usage: .\scripts\migrate.ps1

Write-Host "🚀 Migration Indigo Records - Démarrage..." -ForegroundColor Cyan
Write-Host ""

# Vérifier les variables d'environnement
if (-not $env:VITE_SUPABASE_URL) {
    Write-Host "❌ ERREUR: Variable VITE_SUPABASE_URL non définie" -ForegroundColor Red
    exit 1
}

if (-not $env:SUPABASE_SERVICE_KEY -and -not $env:VITE_SUPABASE_ANON_KEY) {
    Write-Host "❌ ERREUR: Variable SUPABASE_SERVICE_KEY ou VITE_SUPABASE_ANON_KEY non définie" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = if ($env:SUPABASE_SERVICE_KEY) { $env:SUPABASE_SERVICE_KEY } else { $env:VITE_SUPABASE_ANON_KEY }

# Récupérer tous les fichiers SQL
$migrationsPath = Join-Path $PSScriptRoot "..\supabase\migrations"
$sqlFiles = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name

Write-Host "📁 $($sqlFiles.Count) fichier(s) de migration trouvé(s)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $sqlFiles) {
    Write-Host "⏳ Exécution: $($file.Name)..." -ForegroundColor White
    
    $sql = Get-Content -Path $file.FullName -Raw
    
    # Échapper les guillemets pour JSON
    $sqlEscaped = $sql -replace '"', '\"' -replace "`n", "\n" -replace "`r", ""
    
    $body = @{
        query = $sql
    } | ConvertTo-Json -Depth 10
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "apikey" = $supabaseKey
            "Authorization" = "Bearer $supabaseKey"
        }
        
        # Note: Cette approche nécessite un endpoint API personnalisé ou Supabase CLI
        # Alternative: afficher le SQL pour copier-coller
        Write-Host "📋 Contenu à exécuter dans Supabase SQL Editor:" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host $sql -ForegroundColor Gray
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host ""
        
        # Demander confirmation
        $response = Read-Host "✅ Migration appliquée manuellement? (o/n)"
        if ($response -eq "o" -or $response -eq "O") {
            Write-Host "✅ $($file.Name) - Marqué comme appliqué" -ForegroundColor Green
        } else {
            Write-Host "⏭️  $($file.Name) - Ignoré" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($file.Name) - ÉCHEC: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "🎉 Processus de migration terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Pour automatiser complètement, installez Supabase CLI:" -ForegroundColor Cyan
Write-Host "   npm install -g supabase" -ForegroundColor Gray
Write-Host "   supabase db push" -ForegroundColor Gray
