#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use dotenvy::dotenv;

fn main() {
    dotenv().ok();

    let args: Vec<String> = env::args().collect();
    let mut db_url = env::var("DATABASE_URL").unwrap_or_default();
    let mut port = 8080;

    for i in 0..args.len() {
        if args[i] == "--db-url" && i + 1 < args.len() {
            db_url = args[i+1].clone();
        }
        if args[i] == "--port" && i + 1 < args.len() {
           port = args[i+1].parse().unwrap_or(8080);
        }
    }
    
    if !db_url.is_empty() {
         tauri_app_lib::start_actix_server(db_url, port);
    } else {
        println!("Warning: No DB URL provided. Server will not start correctly.");
    }

    tauri_app_lib::run()
}
