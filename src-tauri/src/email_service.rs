use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;
use crate::db::{DbPool, models::EmailConfig};
use diesel::prelude::*;

pub fn send_email(to: &str, subject: &str, _body: &str) {
    // We can't easily access the DB pool here without passing it or using a global/lazy_static which acts as an accessor.
    // For this MVP refactor, to avoid changing all callsites to async/web::Data, we will open a new connection specifically for this task
    // OR simplest hack: We hardcode a lazy connection or pass config.
    // But since "email_service" is called from async handlers that HAVE the pool, the CLEANEST way is to change the signature
    // to accept the pool. But that requires changing many files.
    //
    // ALTERNATIVE: Use the values from .env if we wanted static config, but user wants DYNAMIC DB config.
    //
    // OK, I will change signature to accept &DbPool.
    // This requires me to update callsites in auth.rs, admin.rs, offers.rs.
    println!("Mocking email send (Migration in progress)... To: {}, Subject: {}", to, subject);
}

// Helper to send using a specific config object
pub fn send_raw_email(c: &EmailConfig, to: &str, subject: &str, body: &str) -> Result<(), String> {
    let email = Message::builder()
        .from(c.smtp_from.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .to(to.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .subject(subject)
        .body(String::from(body))
        .map_err(|e: lettre::error::Error| e.to_string())?;

    let creds = Credentials::new(c.smtp_user.clone(), c.smtp_password.clone());

    let mailer = SmtpTransport::relay(&c.smtp_host)
        .map_err(|e| e.to_string())?
        .credentials(creds)
        .port(c.smtp_port as u16)
        .timeout(Some(std::time::Duration::from_secs(10))) // Add 10s timeout
        .build();

    match mailer.send(&email) {
        Ok(_) => {
            println!("EMAIL SENT to {}: Subject: {}", to, subject);
            Ok(())
        },
        Err(e) => {
            println!("Error sending email: {}", e);
            Err(e.to_string())
        }
    }
}

// Updated signatures with Pool
pub fn send_email_with_pool(pool: &DbPool, to: &str, subject: &str, body: &str) {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::email_config::dsl::*;
    
    let config = email_config.find(1).first::<EmailConfig>(&mut conn);
    
    match config {
        Ok(c) => {
             let _ = send_raw_email(&c, to, subject, body);
        },
        Err(_) => {
            println!("Email config not found. Skipping email to {}", to);
        }
    }
}

pub fn send_approved_email(pool: &DbPool, to: &str) {
    send_email_with_pool(pool, to, "Proveedor Aprobado - Portal", "Tu cuenta ha sido aprobada. Ingresa al portal para ver solicitudes.");
}

pub fn send_winner_email(pool: &DbPool, to: &str) {
    send_email_with_pool(pool, to, "Felicidades - Ganaste la cotización", "Tu oferta ha sido seleccionada como ganadora. Procede con el pedido.");
}

pub fn send_rejected_email(pool: &DbPool, to: &str) {
    send_email_with_pool(pool, to, "Solicitud Cerrada", "Gracias por tu oferta. La solicitud ha sido cerrada.");
}

pub fn send_supplier_rejected_email(pool: &DbPool, to: &str) {
    send_email_with_pool(pool, to, "Registro Rechazado", "Lo sentimos, tu solicitud de registro como proveedor ha sido rechazada.");
}

pub fn send_welcome_email(pool: &DbPool, to: &str) {
    send_email_with_pool(pool, to, "Registro Recibido - Portal Proveedores", "Gracias por registrarte en nuestro portal. Tu cuenta está en revisión. En breve recibirás una respuesta.");
}

