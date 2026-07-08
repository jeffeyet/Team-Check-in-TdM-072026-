# Corregir el correo si se escribió mal al correr configurar-github-ssh.
#
# Qué hace:
#   - Corrige el correo con el que Git firma tus cambios (esto es lo importante).
#   - Actualiza la etiqueta de tu llave SSH (esto es solo cosmético).
#   - Verifica que la conexión con GitHub siga funcionando.
# NO toca tu llave ni hace falta volver a pegarla en GitHub.
#
# Cómo usarlo: doble clic al archivo  corregir-correo-github.bat  (está en la
# carpeta windows, un nivel arriba de esta carpeta lib).

# Mostrar bien acentos y símbolos
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$KEY = Join-Path $HOME ".ssh\id_ed25519"

Write-Host ""
Write-Host "════════════════════════════════════════════════"
Write-Host "   Corregir el correo de tu configuración"
Write-Host "════════════════════════════════════════════════"
Write-Host ""

# --- Requisito: tener Git instalado ---
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [Environment]::GetEnvironmentVariable("Path", "User")
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Git no está instalado en esta computadora."
  Write-Host "   Primero corre  configurar-github-ssh.bat  y luego este."
  Read-Host "Presiona Enter para cerrar" | Out-Null
  exit 1
}

# --- Mostrar lo que hay ahora ---
$NOMBRE_ACTUAL = git config --global user.name 2>$null
$CORREO_ACTUAL = git config --global user.email 2>$null
if ([string]::IsNullOrWhiteSpace($NOMBRE_ACTUAL)) { $NOMBRE_ACTUAL = "(sin configurar)" }
if ([string]::IsNullOrWhiteSpace($CORREO_ACTUAL)) { $CORREO_ACTUAL = "(sin configurar)" }
Write-Host "Configuración actual:"
Write-Host "   Nombre: $NOMBRE_ACTUAL"
Write-Host "   Correo: $CORREO_ACTUAL"
Write-Host ""

# --- Pedir el correo correcto, con confirmación para evitar otro error de dedo ---
$NUEVO = ""
while ($true) {
  $NUEVO = ""
  while ([string]::IsNullOrWhiteSpace($NUEVO)) {
    $NUEVO = Read-Host "👉 Escribe el correo CORRECTO de tu cuenta de GitHub y presiona Enter"
  }
  Write-Host ""
  $CONF = Read-Host "   ¿Confirmas que el correo es  $NUEVO ?  (escribe S para sí, N para escribirlo de nuevo)"
  Write-Host ""
  if ($CONF -eq "S" -or $CONF -eq "s") { break }
}

# --- Corregir el correo de Git (lo importante) ---
git config --global user.email "$NUEVO"
Write-Host "✅ Correo de Git corregido: $NUEVO"

# --- Si falta el nombre, aprovechar para configurarlo ---
if ($NOMBRE_ACTUAL -eq "(sin configurar)") {
  $NOMBRE = ""
  while ([string]::IsNullOrWhiteSpace($NOMBRE)) {
    $NOMBRE = Read-Host "👉 También falta tu nombre. Escríbelo y presiona Enter"
  }
  git config --global user.name "$NOMBRE"
  Write-Host "✅ Nombre configurado: $NOMBRE"
}

# --- Actualizar la etiqueta de la llave SSH (solo cosmético) ---
if ((Test-Path $KEY) -and (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
  if ($PSVersionTable.PSVersion -ge [version]"7.3") { $NOPASS = "" } else { $NOPASS = '""' }
  $null = & ssh-keygen -c -C "$NUEVO" -f "$KEY" -P $NOPASS 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Etiqueta de la llave SSH actualizada."
  } else {
    Write-Host "🟡 No se pudo actualizar la etiqueta de la llave (no afecta en nada la conexión)."
  }
} else {
  Write-Host "🟡 No encontré llave SSH en esta computadora. Si aún no corres  configurar-github-ssh.bat , córrelo."
}

# --- Verificar que la conexión con GitHub sigue bien ---
Write-Host ""
Write-Host "Verificando la conexión con GitHub..."
if (Get-Command ssh -ErrorAction SilentlyContinue) {
  # Respuesta de GitHub como texto plano (sin los adornos de error de PowerShell)
  $RESULT = (& ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1 |
    ForEach-Object { "$_" }) -join "`n"
  if ($RESULT -match "successfully authenticated") {
    $USUARIO = ""
    if ($RESULT -match "Hi ([^!]+)!") { $USUARIO = $Matches[1] }
    Write-Host "✅ Conexión con GitHub: funciona. Conectado como: $USUARIO"
  } else {
    Write-Host "⚠️  La conexión con GitHub no funcionó. Esto NO lo causa el correo;"
    Write-Host "   probablemente falta agregar la llave en GitHub. Corre  configurar-github-ssh.bat"
  }
} else {
  Write-Host "⚠️  Esta computadora no tiene las herramientas SSH de Windows activadas."
}

Write-Host ""
Write-Host "════════════════════════════════════════════════"
Write-Host "🎉 Listo. Tus próximos cambios saldrán con el correo correcto."
Write-Host ""
Write-Host "📝 Último paso (en el navegador): revisa que ese correo aparezca en"
Write-Host "   github.com → Settings → Emails. Si no está, agrégalo y verifícalo,"
Write-Host "   para que tus cambios aparezcan ligados a tu perfil de GitHub."
Write-Host "════════════════════════════════════════════════"
Write-Host ""
Read-Host "Presiona Enter para cerrar esta ventana" | Out-Null
