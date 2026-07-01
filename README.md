# PUBLIART Studio ERP 🎨

Sistema operativo empresarial para agencia de publicidad. CRM + Producción + Cotizaciones + Facturación + Kanban + Reportes.

## 🚀 Inicio Rápido (Desarrollo)

### Prerrequisitos
- Node.js 18+
- MongoDB instalado y corriendo en `localhost:27017`
- Carpeta `D:\PRODUCCION` con subcarpetas: `Plotter Vinilo`, `Plotter Banner`, `Corte`, `Laser`

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

El backend corre en: `http://localhost:5000`  
El usuario admin se crea automáticamente: `admin@publiart.co` / `publiart2024`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app corre en: `http://localhost:5173`

---

## 📁 Estructura de Carpetas de Producción

Syncthing debe sincronizar en `D:\PRODUCCION`:

```
D:/PRODUCCION/
├── Plotter Vinilo/     → Trabajos de vinilo
├── Plotter Banner/     → Trabajos de banner
├── Corte/              → Trabajos de corte
└── Laser/              → Trabajos de láser
```

### Formato de nombre de archivo

```
120x150 Barber King.pdf
↑   ↑   ↑____________↑
cm  cm  Nombre cliente
```

El sistema detecta automáticamente al agregar un archivo:
1. ✅ Parsea medidas y nombre del cliente
2. ✅ Calcula el valor con fórmulas configurables
3. ✅ Crea o vincula al cliente
4. ✅ Crea el trabajo de producción
5. ✅ Notifica en tiempo real vía Socket.io
6. ✅ Aparece en el Kanban

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | TailwindCSS v3 |
| Animaciones | Framer Motion |
| Estado | Zustand |
| Gráficos | Recharts |
| Drag & Drop | @hello-pangea/dnd |
| Backend | Node.js + Express + TypeScript |
| Base de datos | MongoDB + Mongoose |
| Auth | JWT (access + refresh) |
| Real-time | Socket.io |
| Monitor carpetas | Chokidar |
| Motor fórmulas | mathjs |

---

## 🔐 Roles

| Rol | Acceso |
|-----|--------|
| admin | Todo el sistema |
| diseñador | Producción, cotizaciones |
| produccion | Kanban, producción |
| ventas | Clientes, cotizaciones, facturas |

---

## 📦 Variables de Entorno

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb://localhost:27017/publiart
JWT_SECRET=tu_secreto_aqui
PRODUCCION_PATH=D:/PRODUCCION
PORT=5000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🐳 Docker (Producción)

```bash
docker-compose up -d
```

---

## 📋 Módulos Implementados

- [x] Autenticación JWT + Roles
- [x] Dashboard con KPIs en tiempo real
- [x] CRM de Clientes (con creación automática)
- [x] Cotizaciones (builder + WhatsApp + duplicar + convertir)
- [x] Facturación (consecutivo + pagos + estados)
- [x] Producción (monitor automático D:/PRODUCCION)
- [x] Kanban drag & drop
- [x] Motor de fórmulas configurable
- [x] Reportes con gráficos
- [x] Auditoría completa
- [x] Notificaciones en tiempo real
- [x] Configurador de negocio (precios, fórmulas, IVA)
- [x] Gestión de usuarios

---

Desarrollado para PUBLIART © 2024
