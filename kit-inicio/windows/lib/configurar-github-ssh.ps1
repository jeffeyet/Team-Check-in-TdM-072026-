# Conectar esta computadora (Windows) con GitHub vía SSH.
#
# Cómo usarlo:
#   Doble clic al archivo  configurar-github-ssh.bat  (está en la carpeta
#   windows, un nivel arriba de esta carpeta lib).
#   Si Windows muestra "Windows protegió tu PC", da clic en
#   "Más información" y luego en "Ejecutar de todas formas".

# Mostrar bien acentos y símbolos
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$KEY = Join-Path $HOME ".ssh\id_ed25519"

# La forma de decirle "sin contraseña" a ssh-keygen cambia según la versión
# de PowerShell (el paso de argumentos vacíos a programas nativos se corrigió
# en la 7.3; el .bat siempre usa la 5.1, que necesita '""').
if ($PSVersionTable.PSVersion -ge [version]"7.3") { $NOPASS = "" } else { $NOPASS = '""' }

# Probar la conexión con GitHub y devolver su respuesta como texto plano
# (sin los adornos de error de PowerShell).
function Probar-GitHub {
  return (& ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1 |
    ForEach-Object { "$_" }) -join "`n"
}

Write-Host ""
Write-Host "════════════════════════════════════════════════"
Write-Host "  Conectar esta computadora con GitHub (vía SSH)"
Write-Host "════════════════════════════════════════════════"
Write-Host ""

# --- Paso 0: revisar que Windows tenga las herramientas SSH ---
if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Esta computadora no tiene las herramientas SSH de Windows."
  Write-Host "   Actívalas así: Configuración → Aplicaciones → Características opcionales"
  Write-Host "   → Agregar una característica → busca 'Cliente OpenSSH' → Instalar."
  Write-Host "   Cuando termine, vuelve a dar doble clic al archivo .bat."
  Read-Host "Presiona Enter para cerrar"
  exit 1
}

# --- Paso 1: revisar si ya existe una llave ---
# Caso raro: existe la llave privada pero falta la mitad pública. La
# reconstruimos para no crear una llave nueva encima de la existente.
if ((Test-Path $KEY) -and (-not (Test-Path "$KEY.pub"))) {
  $pub = & ssh-keygen -y -P $NOPASS -f "$KEY" 2>$null
  if ($LASTEXITCODE -eq 0 -and $pub) {
    Set-Content -Path "$KEY.pub" -Value $pub -Encoding Ascii
  }
}

$EMAIL = ""
if ((Test-Path $KEY) -and (Test-Path "$KEY.pub")) {
  Write-Host "✅ Ya tienes una llave SSH en esta computadora. Se usará esa misma."
} else {
  Write-Host "No tienes llave SSH todavía. Vamos a crear una."
  while ([string]::IsNullOrWhiteSpace($EMAIL)) {
    $EMAIL = Read-Host "👉 Escribe el correo de tu cuenta de GitHub y presiona Enter"
  }
  $sshDir = Join-Path $HOME ".ssh"
  if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }
  ssh-keygen -t ed25519 -C "$EMAIL" -f "$KEY" -N $NOPASS -q
  if (-not ((Test-Path $KEY) -and (Test-Path "$KEY.pub"))) {
    Write-Host "❌ No se pudo crear la llave. Cierra esta ventana e inténtalo de nuevo."
    Read-Host "Presiona Enter para cerrar"
    exit 1
  }
  Write-Host "✅ Llave creada."
}

# --- Paso 2: dejar configurado que ssh use esta llave con GitHub ---
$CONFIG = Join-Path $HOME ".ssh\config"
$yaConfigurado = $false
if (Test-Path $CONFIG) {
  if (Select-String -Path $CONFIG -Pattern "Host github.com" -SimpleMatch -Quiet) {
    $yaConfigurado = $true
  }
}
if (-not $yaConfigurado) {
  # Importante: sin BOM — ssh no entiende archivos de configuración con BOM.
  $bloque = "`nHost github.com`n  IdentityFile ~/.ssh/id_ed25519`n"
  Add-Content -Path $CONFIG -Value $bloque -Encoding Ascii
}

# --- Paso 3: copiar la llave pública al portapapeles ---
Get-Content "$KEY.pub" -Raw | Set-Clipboard
Write-Host "📋 Tu llave pública ya quedó copiada al portapapeles."
Write-Host ""

# --- Paso 4: agregarla en GitHub (en el navegador) ---
Write-Host "Ahora se va a abrir GitHub en tu navegador. Ahí debes:"
Write-Host ""
Write-Host "   1. Iniciar sesión si te lo pide."
Write-Host "   2. En el campo 'Title' escribe un nombre, por ejemplo: Mi laptop"
Write-Host "   3. En el campo grande 'Key' pega la llave con Ctrl + V"
Write-Host "   4. Da clic en el botón verde 'Add SSH key'"
Write-Host ""
Read-Host "Presiona Enter para abrir GitHub" | Out-Null
Start-Process "https://github.com/settings/ssh/new"
Write-Host ""
Read-Host "Cuando ya hayas dado clic en 'Add SSH key', regresa aquí y presiona Enter" | Out-Null

# --- Paso 5: verificar la conexión ---
Write-Host ""
Write-Host "Verificando la conexión con GitHub..."
while ($true) {
  $RESULT = Probar-GitHub
  if ($RESULT -match "successfully authenticated") {
    Write-Host ""
    Write-Host "🎉 ¡Listo! Tu computadora ya está conectada a GitHub."
    if ($RESULT -match "Hi ([^!]+)!") {
      Write-Host "   Conectado como: $($Matches[1])"
    }
    break
  } else {
    Write-Host ""
    Write-Host "⚠️  Todavía no funciona. GitHub respondió:"
    Write-Host "----------------------------------------"
    Write-Host $RESULT.Trim()
    Write-Host "----------------------------------------"
    Write-Host "Revisa que hayas pegado la llave y dado clic en 'Add SSH key' en el navegador."
    Read-Host "Presiona Enter para reintentar (o cierra esta ventana para salir)" | Out-Null
  }
}

# --- Paso 6: revisar e instalar Git si hace falta ---
Write-Host ""
Write-Host "Revisando si Git está instalado..."

function Refrescar-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
              [Environment]::GetEnvironmentVariable("Path", "User")
}

function Git-Disponible {
  Refrescar-Path
  return [bool](Get-Command git -ErrorAction SilentlyContinue)
}

function Abrir-PaginaGit {
  Write-Host "Se va a abrir la página oficial de Git. Ahí debes:"
  Write-Host ""
  Write-Host "   1. Dar clic en 'Click here to download'."
  Write-Host "   2. Abrir el archivo descargado."
  Write-Host "   3. Dar 'Next' a todo hasta que diga 'Install', y esperar a que termine."
  Write-Host ""
  Read-Host "Presiona Enter para abrir la página de Git" | Out-Null
  Start-Process "https://git-scm.com/download/win"
}

if (Git-Disponible) {
  Write-Host "✅ Git ya está instalado: $(git --version)"
} else {
  Write-Host ""
  Write-Host "Git no está instalado. Vamos a instalarlo."
  $instalado = $false
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "Instalando Git con el instalador de Windows (puede tardar varios minutos)."
    Write-Host "Si aparece una ventana pidiendo permiso, da clic en 'Sí'."
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -eq 0) { $instalado = $true }
    if (-not $instalado) {
      Write-Host ""
      Write-Host "⚠️  El instalador automático no pudo (a veces pasa si tu cuenta no tiene"
      Write-Host "   permisos de administrador). Vamos por el camino manual."
      Write-Host ""
    }
  }
  if (-not $instalado) { Abrir-PaginaGit }
  Write-Host ""
  while ($true) {
    $RESP = Read-Host "Cuando la instalación haya TERMINADO, presiona Enter para verificar (o escribe R y Enter para abrir la página de descarga otra vez)"
    if ($RESP -eq "R" -or $RESP -eq "r") { Abrir-PaginaGit; continue }
    if (Git-Disponible) {
      Write-Host "✅ Git instalado: $(git --version)"
      break
    }
    Write-Host ""
    Write-Host "⚠️  Git todavía no aparece instalado."
    Write-Host "   - Si el instalador sigue avanzando, espera a que termine y vuelve a presionar Enter."
    Write-Host "   - Si no pudiste instalarlo, escribe R y Enter para abrir la página de descarga."
    Write-Host "   - Si nada funciona, cierra esta ventana y pide ayuda con una foto de la pantalla."
    Write-Host ""
  }
}

# --- Paso 7: configurar tu nombre y correo en Git (para los commits) ---
$NOMBRE = git config --global user.name 2>$null
$CORREO = git config --global user.email 2>$null

if ([string]::IsNullOrWhiteSpace($NOMBRE)) {
  Write-Host ""
  while ([string]::IsNullOrWhiteSpace($NOMBRE)) {
    $NOMBRE = Read-Host "👉 Escribe tu nombre (así aparecerá en tus cambios) y presiona Enter"
  }
  git config --global user.name "$NOMBRE"
}

if ([string]::IsNullOrWhiteSpace($CORREO)) {
  if (-not [string]::IsNullOrWhiteSpace($EMAIL)) {
    $CORREO = $EMAIL
    Write-Host "Usaré el mismo correo que diste para la llave: $CORREO"
  } else {
    while ([string]::IsNullOrWhiteSpace($CORREO)) {
      $CORREO = Read-Host "👉 Escribe el correo de tu cuenta de GitHub y presiona Enter"
    }
  }
  git config --global user.email "$CORREO"
}
Write-Host "✅ Git configurado como: $NOMBRE <$CORREO>"

Write-Host ""
Write-Host "🎉 Todo listo. Ya puedes clonar el repositorio usando su dirección SSH"
Write-Host "   (la que empieza con git@github.com)."
Write-Host ""
Read-Host "Presiona Enter para cerrar esta ventana" | Out-Null
