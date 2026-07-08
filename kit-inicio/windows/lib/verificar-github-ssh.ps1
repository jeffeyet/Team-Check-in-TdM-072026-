# Verificar que esta computadora (Windows) esté bien conectada con GitHub por SSH.
# Este script NO cambia nada: solo revisa y reporta cada punto.
#
# Cómo usarlo: doble clic al archivo  verificar-github-ssh.bat  (está en la
# carpeta windows, un nivel arriba de esta carpeta lib).

# Mostrar bien acentos y símbolos
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$PROBLEMAS = 0

Write-Host ""
Write-Host "════════════════════════════════════════════════"
Write-Host "   Verificación de la conexión con GitHub"
Write-Host "════════════════════════════════════════════════"
Write-Host ""

# --- 1. ¿Existe la llave SSH? ---
$KEY = Join-Path $HOME ".ssh\id_ed25519"
$otrasLlaves = Get-ChildItem -Path (Join-Path $HOME ".ssh") -Filter "*.pub" -ErrorAction SilentlyContinue
if ((Test-Path $KEY) -and (Test-Path "$KEY.pub")) {
  Write-Host "✅ 1. Llave SSH: existe (id_ed25519)"
} elseif ($otrasLlaves) {
  Write-Host "🟡 1. Llave SSH: tienes una llave pero con otro nombre:"
  $otrasLlaves | ForEach-Object { Write-Host "      $($_.FullName)" }
  Write-Host "      (puede funcionar, pero no es la que crea nuestro script)"
} else {
  Write-Host "❌ 1. Llave SSH: no existe."
  Write-Host "      → Corre el script  configurar-github-ssh.bat"
  $PROBLEMAS = $PROBLEMAS + 1
}
Write-Host ""

# --- 2. ¿Está la configuración para que ssh use la llave? ---
$CONFIG = Join-Path $HOME ".ssh\config"
$configurado = $false
if (Test-Path $CONFIG) {
  if (Select-String -Path $CONFIG -Pattern "Host github.com" -SimpleMatch -Quiet) {
    $configurado = $true
  }
}
if ($configurado) {
  Write-Host "✅ 2. Configuración SSH: lista"
} else {
  Write-Host "🟡 2. Configuración SSH: falta el archivo de configuración."
  Write-Host "      No es grave, pero el script  configurar-github-ssh.bat  lo deja listo."
}
Write-Host ""

# --- 3. ¿Funciona la conexión con GitHub? ---
Write-Host "   Probando la conexión con GitHub (puede tardar unos segundos)..."
if (Get-Command ssh -ErrorAction SilentlyContinue) {
  # Respuesta de GitHub como texto plano (sin los adornos de error de PowerShell)
  $RESULT = (& ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1 |
    ForEach-Object { "$_" }) -join "`n"
  if ($RESULT -match "successfully authenticated") {
    $USUARIO = ""
    if ($RESULT -match "Hi ([^!]+)!") { $USUARIO = $Matches[1] }
    Write-Host "✅ 3. Conexión con GitHub: funciona. Conectado como: $USUARIO"
  } else {
    Write-Host "❌ 3. Conexión con GitHub: falló. GitHub respondió:"
    Write-Host "----------------------------------------"
    Write-Host $RESULT.Trim()
    Write-Host "----------------------------------------"
    Write-Host "      → Revisa que hayas agregado la llave en github.com → Settings → SSH and GPG keys"
    $PROBLEMAS = $PROBLEMAS + 1
  }
} else {
  Write-Host "❌ 3. Conexión con GitHub: esta computadora no tiene las herramientas SSH."
  Write-Host "      → Actívalas en: Configuración → Aplicaciones → Características opcionales"
  Write-Host "        → Agregar una característica → 'Cliente OpenSSH' → Instalar."
  $PROBLEMAS = $PROBLEMAS + 1
}
Write-Host ""

# --- 4 y 5. ¿Git está instalado y configurado? ---
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [Environment]::GetEnvironmentVariable("Path", "User")
if (Get-Command git -ErrorAction SilentlyContinue) {
  Write-Host "✅ 4. Git instalado: $(git --version)"
  Write-Host ""

  $NOMBRE = git config --global user.name 2>$null
  $CORREO = git config --global user.email 2>$null
  if (-not [string]::IsNullOrWhiteSpace($NOMBRE) -and -not [string]::IsNullOrWhiteSpace($CORREO)) {
    Write-Host "✅ 5. Git configurado: $NOMBRE <$CORREO>"
  } else {
    Write-Host "❌ 5. Git configurado: falta tu nombre o tu correo."
    Write-Host "      → Corre el script  configurar-github-ssh.bat  (lo pregunta al final)."
    $PROBLEMAS = $PROBLEMAS + 1
  }
} else {
  Write-Host "❌ 4. Git instalado: no."
  Write-Host "      → Corre el script  configurar-github-ssh.bat  (también instala Git)."
  Write-Host ""
  Write-Host "❌ 5. Git configurado: pendiente (primero instala Git, paso 4)."
  $PROBLEMAS = $PROBLEMAS + 2
}
Write-Host ""

# --- Resumen ---
Write-Host "════════════════════════════════════════════════"
if ($PROBLEMAS -eq 0) {
  Write-Host "🎉 Todo listo. Esta computadora ya puede trabajar con GitHub."
} else {
  Write-Host "⚠️  Hay $PROBLEMAS punto(s) por resolver — busca arriba las líneas"
  Write-Host "   marcadas con ❌ (las que dicen 'no existe', 'falló' o 'falta')."
}
Write-Host "════════════════════════════════════════════════"
Write-Host ""
Read-Host "Presiona Enter para cerrar esta ventana" | Out-Null
