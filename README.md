# Arqueta PrintCards - Sistema de Aprobacion Digital

Sistema tipo DocuSign para gestionar la aprobacion de print cards de empaque. Permite subir PDFs, enviarlos a clientes, recibir firmas digitales y mantener un historial completo de auditoria.

## Funcionalidades

- **Autenticacion completa**: Login, registro y recuperacion de contrasena con Firebase Auth
- **3 roles de usuario**: Administrador, Disenador y Cliente
- **Dashboard con estadisticas**: Total, pendientes, aprobados y rechazados
- **Subir print cards**: PDF con preview, asignacion a cliente, codigos de referencia
- **Organizacion por cliente**: Carpetas virtuales por empresa
- **Firma digital**: Canvas tactil, compatible con mouse y touch
- **Certificado de firma**: Hash SHA-256, timestamp, nombre, email, IP, user agent
- **Historial de auditoria**: Quien hizo que, cuando y desde donde
- **Notificaciones en tiempo real**: Alertas cuando se envian o firman print cards
- **Comentarios**: Discusion por print card
- **Busqueda y filtros**: Por nombre, codigo, estado y cliente
- **Responsive**: Funciona en desktop y mobile

## Setup Rapido

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (ej: `arqueta-printcards`)
3. En **Build > Authentication**: Habilita el proveedor "Email/Password"
4. En **Build > Firestore Database**: Crea una base de datos (modo produccion)
5. En **Build > Storage**: Crea un bucket de storage

### 2. Obtener configuracion

1. En Firebase Console, ve a **Project Settings** (icono de engranaje)
2. En la seccion "Your apps", haz click en el icono Web `</>`
3. Registra la app con un nombre (ej: "ArquetaPrint")
4. Copia los valores de `firebaseConfig`

### 3. Configurar el proyecto

Abre `js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

### 4. Desplegar reglas de seguridad

```bash
npm install -g firebase-tools
firebase login
firebase init  # Selecciona Firestore, Storage y Hosting
firebase deploy
```

O puedes copiar manualmente las reglas:
- `firestore.rules` -> Firestore > Rules en la consola
- `storage.rules` -> Storage > Rules en la consola

### 5. Crear primer usuario admin

1. Abre la app y registrate normalmente seleccionando "Administrador"
2. Listo! Ya puedes crear clientes y subir print cards

## Estructura de archivos

```
arqueta-printcards/
├── index.html              # Login / Registro
├── app.html                # Dashboard principal (SPA)
├── css/
│   └── styles.css          # Design system completo
├── js/
│   ├── firebase-config.js  # Configuracion Firebase (editar aqui)
│   ├── auth.js             # Autenticacion y roles
│   ├── utils.js            # Utilidades, toasts, iconos, audit log
│   └── signature.js        # Firma digital y certificados
├── firebase.json           # Config de Firebase Hosting
├── firestore.rules         # Reglas de seguridad Firestore
├── firestore.indexes.json  # Indices de Firestore
├── storage.rules           # Reglas de seguridad Storage
└── README.md
```

## Flujo de uso

1. **Admin/Disenador** sube un print card (PDF) y lo asigna a un cliente
2. El print card se guarda como "Borrador"
3. **Admin/Disenador** envia el print card al cliente (cambia a "Enviado")
4. **Cliente** recibe notificacion, revisa el PDF
5. **Cliente** firma (canvas digital) y aprueba o rechaza
6. Se genera certificado con hash SHA-256, timestamp y datos del firmante
7. **Admin/Disenador** recibe notificacion del resultado
8. Todo queda en el historial de auditoria

## Base de datos (Firestore)

| Coleccion | Descripcion |
|-----------|-------------|
| `users` | Perfiles de usuario (nombre, email, rol, empresa) |
| `clients` | Empresas cliente |
| `printCards` | Print cards con metadata y URL del archivo |
| `signatures` | Firmas digitales con certificado |
| `auditLog` | Historial completo de acciones |
| `notifications` | Notificaciones por usuario |
| `comments` | Comentarios por print card |

## Deploy a GitHub Pages

1. Sube el proyecto a un repositorio de GitHub
2. Ve a Settings > Pages
3. Selecciona la rama `main` y carpeta `/ (root)`
4. Tu app estara disponible en `https://tu-usuario.github.io/arqueta-printcards/`

**Nota**: Para GitHub Pages, Firebase funciona como backend (auth + database + storage). La app es 100% frontend.

## Tecnologias

- HTML/CSS/JS vanilla (sin frameworks)
- Firebase (Auth, Firestore, Storage)
- PDF.js para renderizar PDFs
- Canvas API para firma digital
- Web Crypto API para hash SHA-256
