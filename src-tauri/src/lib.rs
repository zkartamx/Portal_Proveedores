pub mod api;
pub mod db;
pub mod email_service;

use std::thread;
use actix_web::{App, HttpServer, middleware::Logger};
use actix_cors::Cors;

pub fn start_actix_server(db_url: String, port: u16) {
    thread::spawn(move || {
        let sys = actix_web::rt::System::new();
        sys.block_on(async move {
            let pool = db::establish_connection(&db_url);
            
            println!("Starting server at http://0.0.0.0:{}", port);
            
            HttpServer::new(move || {
                App::new()
                    .wrap(Logger::default())
                    .wrap(Cors::permissive())
                    .app_data(actix_web::web::Data::new(pool.clone()))
                    .configure(api::config)
            })
            .bind(("0.0.0.0", port))
            .expect("Can not bind to port")
            .run()
            .await
            .expect("Server Error");
        });
    });
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
