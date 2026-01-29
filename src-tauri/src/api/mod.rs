use actix_web::web;

pub mod auth;
pub mod requests;
pub mod offers;
pub mod admin;
pub mod config;
pub mod erp;
pub mod suppliers;
pub mod files;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .route("/login", web::post().to(auth::login))
            .route("/register", web::post().to(auth::register))
            .route("/solicitudes", web::post().to(requests::create_request))
            .route("/solicitudes", web::get().to(requests::list_requests))
            .route("/ofertas", web::post().to(offers::create_offer))
            .route("/ofertas/{id}", web::get().to(offers::list_offers))
            .route("/ganadora/{id}", web::put().to(offers::mark_winner))
            .route("/admin/suppliers", web::get().to(admin::list_pending_suppliers))
            .route("/admin/suppliers/approved", web::get().to(admin::list_approved_suppliers))
            .route("/admin/approve/{id}", web::put().to(admin::approve_supplier))
            .route("/admin/reject/{id}", web::delete().to(admin::reject_supplier))
            .route("/admin/compliance/{id}", web::put().to(admin::update_compliance))
            .route("/admin/ofertas", web::get().to(offers::list_all_offers))
            .route("/admin/config/email", web::get().to(config::get_email_config))
            .route("/admin/config/email", web::post().to(config::save_email_config))
            .route("/admin/config/test", web::post().to(config::test_email_config))
            .route("/admin/reset", web::delete().to(admin::reset_database))
            .route("/admin/upgrade", web::post().to(admin::upgrade_database))
            .route("/suppliers/{id}", web::get().to(suppliers::get_supplier))
            .route("/suppliers/{id}/docs", web::put().to(suppliers::update_docs))
            .route("/upload", web::post().to(files::upload_file))
            .service(actix_files::Files::new("/uploads", "./uploads").show_files_listing())
            .route("/erp/import", web::post().to(erp::import_requests))
    );
}
