# 🚀 INSTRUCCIONES NETLIFY - OPTOACADEMY GMAIL

## 📋 RESUMEN
**Proyecto:** SaaS de Fichaje de Empleados - 100% completado
**Para:** optoacademy@gmail.com
**Deploy:** Netlify directo

---

## 🎯 OPCIÓN B: DEPLOY CON TUS CREDENCIALES

### PASO 1: Preparar Repositorio Local

```bash
cd /ruta/a/tu/proyecto/fichajes-app
git init
git add .
git commit -m "SaaS Fichaje de Empleados - Ready for Netlify"
git branch -M main
```

### PASO 2: Conectar con Netlify (optoacademy@gmail.com)

1. **Ve a:** https://netlify.com
2. **Login con:**
   - Usuario: `optoacademy@gmail.com`
   - Contraseña: `Erucampo1`

3. **Crear nuevo sitio:**
   - Click "Add new site"
   - Select "Import an existing project"
   - Choose "Deploy with GitHub" o "Deploy manually"

### PASO 3: Deploy

**Opción A - Desde GitHub:**
```bash
# Crear repo en GitHub primero
git remote add origin https://github.com/tu-usuario/fichajes-saas.git
git push -u origin main

# Luego conectar en Netlify:
# - New site from Git
# - Connect to GitHub
# - Seleccionar tu repo
```

**Opción B - Manual (Recomendado):**
```bash
# 1. Build local
npm install
npm run build

# 2. Deploy manual
# - En Netlify: "Add new site" > "Deploy manually"
# - Arrastra la carpeta .next/
```

### PASO 4: Variables de Entorno en Netlify

**Ir a:** Site Settings > Environment Variables

**Añadir estas variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://cfzlqrwezvasadjfjudd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[OBTENER DE TU PROYECTO SUPABASE]
GOOGLE_MAPS_API_KEY=[OBTENER DE GOOGLE CLOUD CONSOLE]
```

**Cómo obtener las keys:**

1. **Supabase:**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Settings > API
   - Copia: "Project API keys" > "anon public"

2. **Google Maps:**
   - Ve a: https://console.cloud.google.com
   - APIs & Services > Credentials
   - Crea API Key o usa una existente
   - Habilita: Maps JavaScript API, Geocoding API

### PASO 5: Build Settings en Netlify

**Build Settings:**
```
Build command: npm run build
Publish directory: .next
```

**Environment:**
```
Node version: 18
```

---

## 🔧 CONFIGURACIÓN POST-DEPLOY

### 1. Verificar Funcionamiento
Después del deploy, verifica:
- ✅ Home: `https://tu-sitio.netlify.app`
- ✅ Admin: `https://tu-sitio.netlify.app/admin/dashboard`
- ✅ Empleado: `https://tu-sitio.netlify.app/employee/dashboard`
- ✅ Kiosko: `https://tu-sitio.netlify.app/kiosk`

### 2. PWA Instalable
- Abre en móvil
- Debería aparecer "Añadir a pantalla de inicio"

### 3. Usar Sistema Demo

**TechCorp SL:**
- Admin: admin@techcorp.com
- Empleados: PINs 1234, 2345, 3456, 4567, 5678

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Desarrollo local
cd fichajes-app
npm run dev

# Build para producción
npm run build

# Deploy a Netlify (con CLI)
netlify deploy --prod --dir=.next

# Si no tienes Netlify CLI:
npm install -g netlify-cli
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: Variables de entorno
**Síntoma:** Pantalla blanca o errores de conexión
**Solución:** Verificar que las 3 variables estén configuradas en Netlify

### Error: Build falla
**Síntoma:** Build error en Netlify
**Solución:** 
```bash
# Limpiar y rebuild
rm -rf node_modules
npm install
npm run build
```

### Error: Edge Functions
**Síntoma:** 500 errors en funciones
**Solución:** Verificar SUPABASE_SERVICE_ROLE_KEY en variables

### Error: PWA no se instala
**Síntoma:** No aparece "Añadir a pantalla de inicio"
**Solución:** Verificar HTTPS (requerido para PWA)

---

## 📊 MONITOREO

### Netlify Analytics
- Ve a: Site Analytics
- Verifica: Traffic, Performance, Build logs

### Supabase Dashboard
- Ve a: https://supabase.com/dashboard
- Verifica: Edge Functions, Database logs

---

## 🎉 ¡LISTO!

**Después de seguir estos pasos tendrás:**
- ✅ SaaS de Fichaje completamente funcional
- ✅ Panel Admin con gestión completa
- ✅ Panel Empleado con fichaje GPS
- ✅ Kiosko táctil
- ✅ PWA instalable en móvil
- ✅ Cumplimiento legal España/UE
- ✅ Backend Supabase conectado
- ✅ Google Maps integrado

**¡Tu SaaS está listo para conquistar el mercado!** 🚀

---

## 📞 SOPORTE

Si necesitas ayuda:
1. **Documentación:** README_COMPLETO.md
2. **Deploy:** DEPLOY_NETLIFY.md
3. **Legal:** LEGAL.md, SECURITY.md, PRIVACY.md
4. **Backend:** Edge Functions ya desplegadas en Supabase

**¡Disfruta de tu nuevo SaaS de Fichaje!** 🎊
