#!/bin/bash
#
# Corregir el correo si se escribió mal al correr configurar-github-ssh.sh
#
# Qué hace:
#   - Corrige el correo con el que Git firma tus cambios (esto es lo importante).
#   - Actualiza la etiqueta de tu llave SSH (esto es solo cosmético).
#   - Verifica que la conexión con GitHub siga funcionando.
# NO toca tu llave ni hace falta volver a pegarla en GitHub.
#
# Cómo usarlo: abrir Terminal y correr:  bash corregir-correo-github.sh
#

# --- Solo funciona en Mac ---
if [ "$(uname)" != "Darwin" ]; then
  echo "❌ Este script es solo para Mac."
  exit 1
fi

KEY="$HOME/.ssh/id_ed25519"

echo ""
echo "════════════════════════════════════════════════"
echo "   Corregir el correo de tu configuración"
echo "════════════════════════════════════════════════"
echo ""

# --- Requisito: haber corrido antes el script de configuración ---
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

if ! git_disponible; then
  echo "❌ Git no está instalado en esta Mac."
  echo "   Primero corre el script  configurar-github-ssh.sh  y luego este."
  exit 1
fi

# --- Mostrar lo que hay ahora ---
NOMBRE_ACTUAL=$(git config --global user.name 2>/dev/null)
CORREO_ACTUAL=$(git config --global user.email 2>/dev/null)
echo "Configuración actual:"
echo "   Nombre: ${NOMBRE_ACTUAL:-(sin configurar)}"
echo "   Correo: ${CORREO_ACTUAL:-(sin configurar)}"
echo ""

# --- Pedir el correo correcto, con confirmación para evitar otro error de dedo ---
while true; do
  NUEVO=""
  while [ -z "$NUEVO" ]; do
    read -r -p "👉 Escribe el correo CORRECTO de tu cuenta de GitHub y presiona Enter: " NUEVO
  done
  echo ""
  read -r -p "   ¿Confirmas que el correo es  $NUEVO ?  (escribe S para sí, N para escribirlo de nuevo): " CONF
  echo ""
  if [ "$CONF" = "S" ] || [ "$CONF" = "s" ]; then
    break
  fi
done

# --- Corregir el correo de Git (lo importante) ---
git config --global user.email "$NUEVO"
echo "✅ Correo de Git corregido: $NUEVO"

# --- Si falta el nombre, aprovechar para configurarlo ---
if [ -z "$NOMBRE_ACTUAL" ]; then
  NOMBRE=""
  while [ -z "$NOMBRE" ]; do
    read -r -p "👉 También falta tu nombre. Escríbelo y presiona Enter: " NOMBRE
  done
  git config --global user.name "$NOMBRE"
  echo "✅ Nombre configurado: $NOMBRE"
fi

# --- Actualizar la etiqueta de la llave SSH (solo cosmético) ---
if [ -f "$KEY" ]; then
  if ssh-keygen -c -C "$NUEVO" -f "$KEY" -P "" > /dev/null 2>&1; then
    echo "✅ Etiqueta de la llave SSH actualizada."
  else
    echo "🟡 No se pudo actualizar la etiqueta de la llave (no afecta en nada la conexión)."
  fi
else
  echo "🟡 No encontré llave SSH en esta Mac. Si aún no corres  configurar-github-ssh.sh , córrelo."
fi

# --- Verificar que la conexión con GitHub sigue bien ---
echo ""
echo "Verificando la conexión con GitHub..."
RESULT=$(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T git@github.com 2>&1)
if echo "$RESULT" | grep -q "successfully authenticated"; then
  USUARIO=$(echo "$RESULT" | sed -n 's/^Hi \([^!]*\)!.*/\1/p')
  echo "✅ Conexión con GitHub: funciona. Conectado como: $USUARIO"
else
  echo "⚠️  La conexión con GitHub no funcionó. Esto NO lo causa el correo;"
  echo "   probablemente falta agregar la llave en GitHub. Corre  configurar-github-ssh.sh"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "🎉 Listo. Tus próximos cambios saldrán con el correo correcto."
echo ""
echo "📝 Último paso (en el navegador): revisa que ese correo aparezca en"
echo "   github.com → Settings → Emails. Si no está, agrégalo y verifícalo,"
echo "   para que tus cambios aparezcan ligados a tu perfil de GitHub."
echo "════════════════════════════════════════════════"
echo ""
