#!/bin/bash
#
# Conectar esta Mac con GitHub vía SSH.
#
# Cómo usarlo:
#   1. Abre la app "Terminal" (búscala con Cmd + barra espaciadora).
#   2. Escribe:  bash  (con un espacio al final)
#   3. Arrastra este archivo a la ventana de Terminal y presiona Enter.
#

# --- Solo funciona en Mac ---
if [ "$(uname)" != "Darwin" ]; then
  echo "❌ Este script es solo para Mac. Si usas Windows, usa la carpeta  kit-inicio/windows  de este mismo kit."
  exit 1
fi

KEY="$HOME/.ssh/id_ed25519"

echo ""
echo "════════════════════════════════════════════════"
echo "     Conectar esta Mac con GitHub (vía SSH)"
echo "════════════════════════════════════════════════"
echo ""

# Caso raro: existe la llave privada pero falta la mitad pública.
# La reconstruimos para no crear una llave nueva encima de la existente.
if [ -f "$KEY" ] && [ ! -f "$KEY.pub" ]; then
  ssh-keygen -y -P "" -f "$KEY" > "$KEY.pub" 2>/dev/null || rm -f "$KEY.pub"
fi

# --- Paso 1: revisar si ya existe una llave ---
if [ -f "$KEY" ] && [ -f "$KEY.pub" ]; then
  echo "✅ Ya tienes una llave SSH en esta Mac. Se usará esa misma."
else
  echo "No tienes llave SSH todavía. Vamos a crear una."
  EMAIL=""
  while [ -z "$EMAIL" ]; do
    read -r -p "👉 Escribe el correo de tu cuenta de GitHub y presiona Enter: " EMAIL
  done
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  ssh-keygen -t ed25519 -C "$EMAIL" -f "$KEY" -N "" -q
  echo "✅ Llave creada."
fi

# --- Paso 2: activar la llave y guardarla en el llavero de la Mac ---
eval "$(ssh-agent -s)" > /dev/null
ssh-add --apple-use-keychain "$KEY" 2>/dev/null

# Dejar configurado que la llave se cargue sola en el futuro (después de reiniciar)
CONFIG="$HOME/.ssh/config"
if ! grep -qs "Host github.com" "$CONFIG"; then
  cat >> "$CONFIG" << 'EOF'

Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
EOF
fi

# --- Paso 3: copiar la llave pública al portapapeles ---
pbcopy < "$KEY.pub"
echo "📋 Tu llave pública ya quedó copiada al portapapeles."
echo ""

# --- Paso 4: agregarla en GitHub (en el navegador) ---
echo "Ahora se va a abrir GitHub en tu navegador. Ahí debes:"
echo ""
echo "   1. Iniciar sesión si te lo pide."
echo "   2. En el campo 'Title' escribe un nombre, por ejemplo: Mi Mac"
echo "   3. En el campo grande 'Key' pega la llave con Cmd + V"
echo "   4. Da clic en el botón verde 'Add SSH key'"
echo ""
read -r -p "Presiona Enter para abrir GitHub..."
open "https://github.com/settings/ssh/new"
echo ""
read -r -p "Cuando ya hayas dado clic en 'Add SSH key', regresa aquí y presiona Enter..."

# --- Paso 5: verificar la conexión ---
echo ""
echo "Verificando la conexión con GitHub..."
while true; do
  RESULT=$(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1)
  if echo "$RESULT" | grep -q "successfully authenticated"; then
    echo ""
    echo "🎉 ¡Listo! Tu Mac ya está conectada a GitHub."
    echo "   GitHub respondió: $(echo "$RESULT" | grep "successfully" )"
    break
  else
    echo ""
    echo "⚠️  Todavía no funciona. GitHub respondió:"
    echo "----------------------------------------"
    echo "$RESULT"
    echo "----------------------------------------"
    echo "Revisa que hayas pegado la llave y dado clic en 'Add SSH key' en el navegador."
    read -r -p "Presiona Enter para reintentar (o Ctrl + C para salir)..."
  fi
done

# --- Paso 6: revisar e instalar Git si hace falta ---
echo ""
echo "Revisando si Git está instalado..."

# Git está disponible si existen las herramientas de Apple, o si hay un Git
# instalado por otra vía (por ejemplo Homebrew) que funcione de verdad.
git_disponible() {
  if xcode-select -p > /dev/null 2>&1; then
    return 0
  fi
  GITBIN=$(command -v git 2>/dev/null)
  if [ -n "$GITBIN" ] && [ "$GITBIN" != "/usr/bin/git" ] && "$GITBIN" --version > /dev/null 2>&1; then
    return 0
  fi
  return 1
}

if git_disponible; then
  echo "✅ Git ya está instalado: $(git --version)"
else
  echo ""
  echo "Git no está instalado. Se va a abrir una ventana de macOS pidiendo"
  echo "instalar las 'herramientas de línea de comandos'. En esa ventana:"
  echo ""
  echo "   1. Da clic en 'Instalar' (NO en 'Obtener Xcode')."
  echo "   2. Acepta la licencia."
  echo "   3. Espera a que termine — puede tardar varios minutos."
  echo ""
  read -r -p "Presiona Enter para abrir la ventana de instalación..."
  xcode-select --install 2>/dev/null || true
  echo ""
  while true; do
    read -r -p "Cuando la instalación haya TERMINADO, presiona Enter para verificar (o escribe R y Enter si cancelaste la ventana y quieres abrirla de nuevo): " RESP
    if [ "$RESP" = "R" ] || [ "$RESP" = "r" ]; then
      xcode-select --install 2>/dev/null || true
      continue
    fi
    if git_disponible; then
      echo "✅ Git instalado: $(git --version)"
      break
    fi
    echo ""
    echo "⚠️  Git todavía no aparece instalado."
    echo "   - Si la ventana sigue avanzando, espera a que termine y vuelve a presionar Enter."
    echo "   - Si no hay ninguna ventana abierta, escribe R y Enter para abrirla otra vez."
    echo "   - Si marca un error de descarga, revisa tu internet e intenta de nuevo."
    echo ""
  done
fi

# --- Paso 7: configurar tu nombre y correo en Git (para los commits) ---
NOMBRE=$(git config --global user.name 2>/dev/null)
CORREO=$(git config --global user.email 2>/dev/null)

if [ -z "$NOMBRE" ]; then
  echo ""
  while [ -z "$NOMBRE" ]; do
    read -r -p "👉 Escribe tu nombre (así aparecerá en tus cambios) y presiona Enter: " NOMBRE
  done
  git config --global user.name "$NOMBRE"
fi

if [ -z "$CORREO" ]; then
  if [ -n "$EMAIL" ]; then
    CORREO="$EMAIL"
    echo "Usaré el mismo correo que diste para la llave: $CORREO"
  else
    while [ -z "$CORREO" ]; do
      read -r -p "👉 Escribe el correo de tu cuenta de GitHub y presiona Enter: " CORREO
    done
  fi
  git config --global user.email "$CORREO"
fi
echo "✅ Git configurado como: $NOMBRE <$CORREO>"

echo ""
echo "🎉 Todo listo. Ya puedes clonar el repositorio usando su dirección SSH"
echo "   (la que empieza con git@github.com)."
echo ""
