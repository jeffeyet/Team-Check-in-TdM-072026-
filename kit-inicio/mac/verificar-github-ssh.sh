#!/bin/bash
#
# Verificar que esta Mac esté bien conectada con GitHub por SSH.
# Este script NO cambia nada: solo revisa y reporta cada punto.
#
# Cómo usarlo: abrir Terminal y correr:  bash verificar-github-ssh.sh
#

# --- Solo funciona en Mac ---
if [ "$(uname)" != "Darwin" ]; then
  echo "❌ Este script es solo para Mac."
  exit 1
fi

PROBLEMAS=0

echo ""
echo "════════════════════════════════════════════════"
echo "   Verificación de la conexión con GitHub"
echo "════════════════════════════════════════════════"
echo ""

# --- 1. ¿Existe la llave SSH? ---
KEY="$HOME/.ssh/id_ed25519"
if [ -f "$KEY" ] && [ -f "$KEY.pub" ]; then
  echo "✅ 1. Llave SSH: existe (id_ed25519)"
elif ls "$HOME"/.ssh/*.pub > /dev/null 2>&1; then
  echo "🟡 1. Llave SSH: tienes una llave pero con otro nombre:"
  ls "$HOME"/.ssh/*.pub
  echo "      (puede funcionar, pero no es la que crea nuestro script)"
else
  echo "❌ 1. Llave SSH: no existe."
  echo "      → Corre el script  configurar-github-ssh.sh"
  PROBLEMAS=$((PROBLEMAS + 1))
fi
echo ""

# --- 2. ¿Está la configuración para que la llave cargue sola? ---
if grep -qs "Host github.com" "$HOME/.ssh/config"; then
  echo "✅ 2. Configuración SSH: lista (la llave se carga sola al reiniciar)"
else
  echo "🟡 2. Configuración SSH: falta el archivo de configuración."
  echo "      No es grave, pero el script  configurar-github-ssh.sh  lo deja listo."
fi
echo ""

# --- 3. ¿Funciona la conexión con GitHub? ---
echo "   Probando la conexión con GitHub (puede tardar unos segundos)..."
RESULT=$(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1)
if echo "$RESULT" | grep -q "successfully authenticated"; then
  USUARIO=$(echo "$RESULT" | sed -n 's/^Hi \([^!]*\)!.*/\1/p')
  echo "✅ 3. Conexión con GitHub: funciona. Conectado como: $USUARIO"
else
  echo "❌ 3. Conexión con GitHub: falló. GitHub respondió:"
  echo "----------------------------------------"
  echo "$RESULT"
  echo "----------------------------------------"
  echo "      → Revisa que hayas agregado la llave en github.com → Settings → SSH and GPG keys"
  PROBLEMAS=$((PROBLEMAS + 1))
fi
echo ""

# --- 4 y 5. ¿Git está instalado y configurado? ---
GIT_OK=0
if xcode-select -p > /dev/null 2>&1; then
  GIT_OK=1
else
  # Git instalado por otra vía (por ejemplo Homebrew), que no sea el aviso de macOS
  GITBIN=$(command -v git 2>/dev/null)
  if [ -n "$GITBIN" ] && [ "$GITBIN" != "/usr/bin/git" ] && "$GITBIN" --version > /dev/null 2>&1; then
    GIT_OK=1
  fi
fi

if [ "$GIT_OK" -eq 1 ]; then
  echo "✅ 4. Git instalado: $(git --version)"
  echo ""

  NOMBRE=$(git config --global user.name 2>/dev/null)
  CORREO=$(git config --global user.email 2>/dev/null)
  if [ -n "$NOMBRE" ] && [ -n "$CORREO" ]; then
    echo "✅ 5. Git configurado: $NOMBRE <$CORREO>"
  else
    echo "❌ 5. Git configurado: falta tu nombre o tu correo. Corre estos dos comandos:"
    echo '      git config --global user.name "Tu Nombre"'
    echo '      git config --global user.email "tu-correo@ejemplo.com"'
    PROBLEMAS=$((PROBLEMAS + 1))
  fi
else
  echo "❌ 4. Git instalado: no."
  echo "      → Corre el script  configurar-github-ssh.sh  (ahora también instala Git),"
  echo "        o directamente este comando y acepta la instalación:  xcode-select --install"
  echo ""
  echo "❌ 5. Git configurado: pendiente (primero instala Git, paso 4)."
  PROBLEMAS=$((PROBLEMAS + 2))
fi
echo ""

# --- Resumen ---
echo "════════════════════════════════════════════════"
if [ "$PROBLEMAS" -eq 0 ]; then
  echo "🎉 Todo listo. Esta Mac ya puede trabajar con GitHub."
else
  echo "⚠️  Hay $PROBLEMAS punto(s) por resolver — busca los ❌ arriba."
fi
echo "════════════════════════════════════════════════"
echo ""
