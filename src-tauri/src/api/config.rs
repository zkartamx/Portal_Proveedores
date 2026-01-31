use actix_web::{web, HttpResponse, Responder};
use crate::db::{DbPool, models::{EmailConfig, UpdateEmailConfig}};
use diesel::prelude::*;

pub async fn get_email_config(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::email_config::dsl::*;

    let config = email_config.find(1).first::<EmailConfig>(&mut conn);

    match config {
        Ok(mut c) => {
            // Mask password or return empty/placeholder
            c.smtp_password = "".to_string(); 
            HttpResponse::Ok().json(c)
        },
        Err(_) => HttpResponse::NotFound().body("Config not found"),
    }
}

pub async fn save_email_config(
    pool: web::Data<DbPool>,
    item: web::Json<UpdateEmailConfig>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::email_config::dsl::*;

    println!("Saving config: theme={}, host={}, password_len={}", item.ui_theme, item.smtp_host, item.smtp_password.len());
    
    // Always update theme and basic fields
    let mut updated = diesel::update(email_config.find(1))
        .set((
            smtp_host.eq(&item.smtp_host),
            smtp_port.eq(item.smtp_port),
            smtp_user.eq(&item.smtp_user),
            smtp_from.eq(&item.smtp_from),
            ui_theme.eq(&item.ui_theme),
        ))
        .get_result::<EmailConfig>(&mut conn);

    // Only update password if not empty (it comes masked from frontend)
    if !item.smtp_password.is_empty() {
        updated = diesel::update(email_config.find(1))
            .set(smtp_password.eq(&item.smtp_password))
            .get_result::<EmailConfig>(&mut conn);
    }

    match updated {
        Ok(c) => HttpResponse::Ok().json(c),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn test_email_config(
    item: web::Json<UpdateEmailConfig>,
) -> impl Responder {
    println!("Received test email request for: {}", item.smtp_from);
    
    let config = EmailConfig {
        id: 0, // Dummy
        smtp_host: item.smtp_host.clone(),
        smtp_port: item.smtp_port,
        smtp_user: item.smtp_user.clone(),
        smtp_password: item.smtp_password.clone(),
        smtp_from: item.smtp_from.clone(),
        ui_theme: item.ui_theme.clone(),
    };

    use crate::email_service;
    
    // Offload blocking SMTP task to threadpool
    let result = web::block(move || {
        email_service::send_raw_email(&config, &config.smtp_from, "Test Email - Portal", "This is a test email to verify SMTP settings.")
    }).await;

    match result {
        Ok(Ok(_)) => HttpResponse::Ok().body("Test email sent successfully"),
        Ok(Err(e)) => {
            println!("SMTP Error: {}", e);
            HttpResponse::BadRequest().body(format!("Failed to send email: {}", e))
        },
        Err(e) => {
            println!("Blocking Error: {}", e);
            HttpResponse::InternalServerError().body("Internal Server Error processing email")
        }
    }
}
