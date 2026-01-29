# Portal de Proveedores

Este es un sistema de cotización inversa desarrollado en Rust (Tauri + Actix-web) y React.

## Requisitos Previos

*   Node.js y npm
*   Rust y Cargo
*   Docker (para la base de datos PostgreSQL)
*   Librerías de desarrollo de su sistema operativo para Tauri (Linux: webkit2gtk, etc.)
*   **macOS**: Requiere `libpq` instalado (`brew install libpq` y `brew link --force libpq`).

## Configuración y Ejecución

1.  **Iniciar Base de Datos**:
    ```bash
    docker-compose up -d
    ```

2.  **Configurar Base de Datos**:
    Necesitamos ejecutar las migraciones. Como no hemos configurado `diesel_cli` en el proyecto, el sistema intentará conectarse, pero las tablas deben existir.
    
    *Opción A (Recomendada si tienes diesel-cli)*:
    ```bash
    diesel setup
    diesel migration run
    ```
    
    *Opción B (Manual)*:
    Conéctate a la base de datos y ejecuta el SQL generado en `src-tauri/src/db/schema.rs` adaptado a SQL real (CREATE TABLE...).
    
    *Nota: Para facilitar, asegúrese de que la base de datos `supplier_portal` esté accesible.*

3.  **Instalar Dependencias Frontend**:
    ```bash
    npm install
    ```

4.  **Ejecutar Aplicación (Modo Desarrollo)**:
    Esto iniciará tanto el frontend (Vite) como el backend (Tauri + Actix).
    ```bash
    npm run tauri dev
    ```

5.  **Compilar Binario Único**:
    ```bash
    npm run tauri build
    ```
    El binario resultante estará en `src-tauri/target/release/`.

## API Docs (Para ERP)

El servidor API se inicia en el puerto 8080 por defecto.
*   `POST /api/solicitudes`: Crear solicitud (desde ERP)
*   `GET /api/ofertas/{id}`: Ver ofertas

## Panel de Administración

Para aprobar proveedores pendientes, acceda a:
`http://localhost:1420/admin` (o el puerto configurado por Tauri/Vite).
Desde allí podrá aprobar las cuentas recién registradas para que puedan iniciar sesión.

## Notas
*   Los archivos adjuntos se simulan como rutas de texto en esta versión MVP.
*   La autenticación usa JWT en memoria/localstorage.
*   **Correos**: Se simulan imprimiendo en la consola del backend (stdout).
