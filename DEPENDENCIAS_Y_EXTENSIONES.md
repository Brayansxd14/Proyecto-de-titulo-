# Dependencias y extensiones del proyecto

Este documento resume las librerías que usa el proyecto y las extensiones recomendadas para trabajar en VS Code de forma más eficiente.

## 1. Dependencias del proyecto

Estas se definen en el archivo `package.json` y son necesarias para que la aplicación funcione correctamente.

### Dependencias de producción

| Paquete | Versión | Uso principal |
|---|---:|---|
| `@supabase/server` | `^1.4.1` | Servicios del backend con Supabase |
| `@supabase/supabase-js` | `^2.112.4` | Cliente de Supabase para frontend/backend |
| `axios` | `^1.20.0` | Peticiones HTTP desde frontend |
| `bcrypt` | `^6.0.0` | Encriptación de contraseñas |
| `chart.js` | `^4.5.1` | Generación de gráficos |
| `cors` | `^2.8.6` | Habilita acceso cruzado entre frontend y backend |
| `dotenv` | `^17.4.2` | Carga variables de entorno |
| `express` | `^5.2.1` | Servidor web y API REST |
| `jsonwebtoken` | `^9.0.3` | Generación y validación de tokens JWT |
| `multer` | `^2.4.0` | Subida de archivos e imágenes |
| `pg` | `^8.23.0` | Cliente PostgreSQL |
| `qrcode.react` | `^4.2.0` | Generación de códigos QR |
| `react` | `^19.2.8` | Librería principal para la UI |
| `react-chartjs-2` | `^5.3.1` | Componentes React para Chart.js |
| `react-dom` | `^19.2.8` | Renderizado del frontend |
| `react-icons` | `^5.7.0` | Iconografía para interfaz |
| `react-router-dom` | `^7.18.3` | Enrutamiento del sistema |
| `xlsx` | `^0.18.5` | Lectura y exportación de Excel |

### Dependencias de desarrollo

| Paquete | Versión | Uso principal |
|---|---:|---|
| `@babel/core` | `^7.29.7` | Compilación/transpilación de JavaScript |
| `@eslint/js` | `^10.0.1` | Base para ESLint |
| `@rolldown/plugin-babel` | `^0.2.3` | Integración Babel en Vite/Rolldown |
| `@types/react` | `^19.2.17` | Tipado para React |
| `@types/react-dom` | `^19.2.3` | Tipado para React DOM |
| `@vitejs/plugin-react` | `^6.0.4` | Plugin React para Vite |
| `babel-plugin-react-compiler` | `^1.0.0` | Optimización de React Compiler |
| `concurrently` | `^10.0.5` | Ejecuta varios procesos en paralelo |
| `eslint` | `^10.8.0` | Revisión de código y buenas prácticas |
| `eslint-plugin-react-hooks` | `^7.1.1` | Reglas para hooks de React |
| `eslint-plugin-react-refresh` | `^0.5.3` | Soporte para React Refresh |
| `globals` | `^17.7.0` | Variables globales para ESLint |
| `nodemon` | `^3.1.14` | Reinicia automáticamente el backend |
| `vite` | `^8.2.0` | Bundler y servidor de desarrollo |

### Scripts principales del proyecto

Los scripts configurados en `package.json` son:

- `npm run dev` → inicia Vite para el frontend
- `npm run build` → compila la aplicación para producción
- `npm run lint` → revisa errores con ESLint
- `npm run preview` → vista previa de producción
- `npm run start` → levanta backend y frontend juntos
- `npm run server` → inicia el backend con nodemon
- `npm run client` → inicia el cliente frontend

---

## 2. Extensiones recomendadas para VS Code

Estas no forman parte de `package.json`, pero son muy útiles para trabajar con este proyecto.

### Extensiones esenciales

- `dbaeumer.vscode-eslint`  
  Revisa errores y advertencias de JavaScript/React.

- `esbenp.prettier-vscode`  
  Formatea automáticamente el código para mantener estilo uniforme.

- `GitHub.copilot`  
  Asistente de IA para completar código, sugerencias y refactorización.

- `GitHub.copilot-chat`  
  Chat de soporte para dudas del proyecto y ayuda contextual.

### Extensiones muy útiles para este stack

- `ms-vscode.vscode-json`  
  Mejor soporte para archivos JSON, como `package.json` y configuraciones.

- `ms-vscode.vscode-typescript-next`  
  Excelente compatibilidad para proyectos JS/TS modernos.

- `Orta.vscode-jest`  
  Útil si más adelante agregan pruebas automatizadas.

- `PKief.material-icon-theme`  
  Mejora la experiencia visual del explorador de archivos.

- `ms-azuretools.vscode-docker`  
  Útil si se trabaja con contenedores o despliegues.

### Extensiones adicionales recomendadas

- `christian-kohler.path-intellisense`  
  Autocompleta rutas de archivos.

- `formulahendry.auto-rename-tag`  
  Ayuda con etiquetas HTML/JSX.

- `ms-vscode.live-server`  
  Útil para pruebas rápidas de frontend estático.

---

## 3. Recomendación práctica

Para este proyecto, las extensiones más recomendadas son:

1. `dbaeumer.vscode-eslint`
2. `esbenp.prettier-vscode`
3. `GitHub.copilot`
4. `GitHub.copilot-chat`
5. `PKief.material-icon-theme`

Estas permiten trabajar con React, Node.js, Express, PostgreSQL y mantener un flujo de desarrollo ordenado.

---

## 4. Instalación rápida

Si quieres instalarlas desde VS Code, puedes usar el terminal:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
code --install-extension PKief.material-icon-theme
```

---

## 5. Resumen

Este proyecto usa principalmente:

- React + Vite para la interfaz
- Express + Node.js para el backend
- PostgreSQL con `pg` para almacenamiento de datos
- JWT, bcrypt y multer para autenticación y archivos
- Chart.js, XLSX, QR y rutas para funciones del negocio

Y para trabajarlo mejor en VS Code, lo ideal es tener ESLint, Prettier, GitHub Copilot y soporte visual de archivos.
