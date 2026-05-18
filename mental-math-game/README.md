# Mental Math Challenge

Juego móvil de cálculos mentales hecho con React Native + Expo + TypeScript.

## Qué incluye

- Perfil local por nombre
- 3 pantallas principales con bottom nav
- Configuración general
- Configuración de partida
- Modo clásico, verdadero/falso y multiple choice
- Contrarreloj como toggle
- Dificultad dinámica como toggle incompatible con contrarreloj
- Persistencia local con AsyncStorage
- Ranking global con filtros
- Estadísticas y gráficos simples
- Sonidos, música y vibración opcionales
- Resumen final de partida con detalle de respuestas

## Requisitos

- Node.js 18 o 20
- npm
- Android Studio o un dispositivo con Expo Go

## Instalación

1. Descomprimí el ZIP.
2. Abrí una terminal dentro de la carpeta del proyecto.
3. Instalá dependencias:

```bash
npm install
```

Si Expo te marca alguna dependencia desalineada, corré:

```bash
npx expo install
```

## Ejecutar la app

```bash
npm start
```

o también:

```bash
npx expo start
```

Después:

- presioná `a` para abrir en Android emulator
- o escaneá el QR desde Expo Go en tu celular Android

## Estructura de uso

1. Al abrir, ingresás un nombre de perfil.
2. En la pantalla izquierda configurás sonidos, música, vibración y sesión.
3. En la pantalla central elegís modo, dificultad, iteraciones y toggles de partida.
4. En la pantalla derecha ves ranking y estadísticas.
5. Tocás **Jugar** para empezar.
6. Al terminar, aparece un resumen final con detalle de respuestas.

## Notas

- La app está pensada solo para Android.
- No usa internet.
- Todo se guarda localmente.
- Los toggles de **Contrarreloj** y **Dificultad dinámica** son incompatibles.
- En partidas normales hay vidas según dificultad.
- En contrarreloj se suma tiempo por aciertos y se resta por errores o timeout.
