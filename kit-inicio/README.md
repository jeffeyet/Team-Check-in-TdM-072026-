# 🎓 Kit de inicio — Conecta tu computadora con GitHub

Este kit es para ti si **nunca has usado la Terminal ni GitHub**. Al terminar,
tu computadora quedará conectada a GitHub y lista para colaborar en las
actividades del curso. No necesitas saber programar: los scripts hacen el
trabajo y te van diciendo qué hacer en cada paso.

> **English note:** this starter kit walks students with zero terminal
> experience through connecting their computer to GitHub (SSH key, Git
> install, and identity setup). All student-facing text is in Spanish.

---

## Paso 0 — Crea tu cuenta de GitHub (5 min)

1. Entra a [github.com/signup](https://github.com/signup) en tu navegador.
2. Regístrate con un correo que revises seguido.
3. **Anota tu nombre de usuario** (username) — lo vas a necesitar en el Paso 3.

¿Ya tienes cuenta? Salta al Paso 1.

## Paso 1 — Descarga este kit (2 min)

1. Ve a la **página principal** del repositorio en GitHub. (Si estás leyendo
   esta guía dentro de GitHub, da clic en el nombre del repositorio, arriba a
   la izquierda, para llegar ahí.)
2. Da clic en el botón verde **`<> Code`** y luego en **Download ZIP**.
3. Abre tu carpeta de **Descargas** y descomprime el archivo:
   - **Mac:** doble clic al `.zip`.
   - **Windows:** clic derecho al `.zip` → **Extraer todo…** → **Extraer**.
     ⚠️ Descomprimir es obligatorio: si solo le das doble clic al `.zip` y
     entras, los scripts no van a funcionar.
4. La carpeta descomprimida se llama **`Team-Check-in-TdM-072026--main`**
   (en Windows a veces hay otra carpeta con el mismo nombre adentro — sigue
   entrando). Ahí está la carpeta **`kit-inicio`**.

## Paso 2 — Conecta tu computadora (10-15 min)

Elige tu sistema:

### 🍎 Si tienes Mac

1. Abre la app **Terminal**: presiona `Cmd + barra espaciadora`, escribe
   `Terminal` y presiona Enter.
2. En la ventana de Terminal escribe `bash ` (la palabra bash y **un espacio**).
   **No presiones Enter todavía.**
3. Arrastra el archivo `kit-inicio/mac/configurar-github-ssh.sh` desde tu
   carpeta hasta la ventana de Terminal, y **ahora sí** presiona Enter.
4. Sigue las instrucciones en pantalla. El script te pedirá tu correo, abrirá
   GitHub en tu navegador para pegar una "llave", y verificará que todo quedó.

### 🪟 Si tienes Windows

1. Abre la carpeta `kit-inicio/windows`.
2. Doble clic al archivo **`configurar-github-ssh.bat`**.
3. Si aparece una ventana azul que dice **"Windows protegió tu PC"**: da clic
   en **Más información** y luego en **Ejecutar de todas formas**. (Aparece
   porque el archivo se descargó de internet; es nuestro script.)
4. Sigue las instrucciones en pantalla, igual que en Mac.

## Paso 3 — Avisa que terminaste (1 min)

Manda tu **nombre de usuario de GitHub** (el del Paso 0) a quien coordina tu
grupo:

> **Coordinador/a:** _________________ — mándale tu username por
> _________________ (chat del grupo / formulario).
> *(Instructor: llena estos espacios antes de repartir el kit.)*

Con eso te llegará una **invitación de colaborador** por correo: ábrela y da
clic en **Accept invitation**. Hazlo el mismo día — las invitaciones caducan
a los 7 días.

## ¿Algo salió mal?

| Problema | Qué hacer |
|---|---|
| Quiero revisar si todo quedó bien | Corre el script `verificar-github-ssh` de tu sistema (en Mac: igual que el Paso 2 pero con ese archivo; en Windows: doble clic al `.bat`). No cambia nada, solo revisa. |
| Escribí mal mi correo | Corre el script `corregir-correo-github` de tu sistema. |
| (Mac) Le di doble clic al archivo y se abrió un editor con puro código | No pasa nada malo: ciérralo y usa el método del Paso 2 (escribir `bash ` con espacio y arrastrar el archivo a Terminal). |
| (Mac) Terminal dice "permission denied" | Te faltó escribir `bash ` (con un espacio) antes de arrastrar el archivo. Escribe `bash `, arrastra de nuevo y presiona Enter. |
| (Windows) La ventana se cierra sola o muestra un error en inglés | Tómale una foto a la pantalla y mándala a quien coordina tu grupo. No uses "Ejecutar como administrador". |
| GitHub responde "Permission denied (publickey)" | Falta pegar la llave en GitHub: corre otra vez `configurar-github-ssh` y sigue el paso del navegador con calma. |
| Mi invitación ya no funciona | Pide que te la reenvíen (caducan a los 7 días). |
| Nada de esto funcionó | Manda una foto de la pantalla completa al chat del grupo — con eso es muy fácil ayudarte. |

## ¿Qué contiene este kit?

```
kit-inicio/
├── README.md                     ← esta guía
├── mac/                          ← scripts para Mac
│   ├── configurar-github-ssh.sh
│   ├── verificar-github-ssh.sh
│   └── corregir-correo-github.sh
├── windows/                      ← scripts para Windows (doble clic a los .bat)
│   ├── configurar-github-ssh.bat
│   ├── verificar-github-ssh.bat
│   ├── corregir-correo-github.bat
│   └── lib/                        (el código que usan los .bat — no entres aquí)
└── instructor/                   ← herramientas para el instructor
```

Los scripts solo configuran tu conexión con GitHub (crean una "llave" en tu
computadora, la registran en tu cuenta e instalan Git). No tocan nada más.
