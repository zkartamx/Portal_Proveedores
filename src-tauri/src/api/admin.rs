use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use crate::db::{DbPool, models::Supplier};
use diesel::prelude::*;
use crate::email_service;

pub async fn list_pending_suppliers(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::suppliers::dsl::*;

    let results = suppliers
        .filter(active.eq(false))
        .load::<Supplier>(&mut conn);

    match results {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn list_approved_suppliers(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::suppliers::dsl::*;

    let results = suppliers
        .filter(active.eq(true))
        .load::<Supplier>(&mut conn);

    match results {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn reject_supplier(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
) -> impl Responder {
    let supp_id = path.into_inner();
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::suppliers::dsl::*;

    // Get email before deleting to send notification
    let supplier_email: String = suppliers
        .find(supp_id)
        .select(email)
        .first(&mut conn)
        .unwrap_or_default();

    let deleted = diesel::delete(suppliers.find(supp_id))
        .execute(&mut conn);

    match deleted {
        Ok(_) => {
            if !supplier_email.is_empty() {
                 email_service::send_supplier_rejected_email(&pool, &supplier_email);
            }
            HttpResponse::Ok().json("Deleted")
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn approve_supplier(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
) -> impl Responder {
    let supp_id = path.into_inner();
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::suppliers::dsl::*;

    let updated = diesel::update(suppliers.find(supp_id))
        .set(active.eq(true))
        .get_result::<Supplier>(&mut conn);

    match updated {
        Ok(supplier) => {
            // Send email
            email_service::send_approved_email(&pool, &supplier.email);
            HttpResponse::Ok().json(supplier)
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn reset_database(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::{offers, requests, suppliers};

    // Delete all offers
    let _ = diesel::delete(offers::table).execute(&mut conn);
    
    // Delete all requests
    let _ = diesel::delete(requests::table).execute(&mut conn);

    // Delete all suppliers (except maybe keep one for testing if needed, but "reset" usually means wipe)
    // For now we wipe all to clear "registros".
    let _ = diesel::delete(suppliers::table).execute(&mut conn);

    HttpResponse::Ok().json("Database reset successfully")
}

pub async fn upgrade_database(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    
    // Raw SQL execution
    let _ = diesel::sql_query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();")
        .execute(&mut conn);
        
    let _ = diesel::sql_query("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN NOT NULL DEFAULT FALSE;")
        .execute(&mut conn);
    let _ = diesel::sql_query("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;")
        .execute(&mut conn);
    let _ = diesel::sql_query("ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_audited BOOLEAN NOT NULL DEFAULT FALSE;")
        .execute(&mut conn);

    HttpResponse::Ok().json("Database schema upgraded (compliance columns added)")
}

#[derive(Deserialize)]
pub struct ComplianceUpdate {
    pub is_reviewed: bool,
    pub is_approved: bool,
    pub is_audited: bool,
}

pub async fn update_compliance(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
    item: web::Json<ComplianceUpdate>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    let supplier_id = path.into_inner();

    use crate::db::schema::suppliers::dsl::*;

    let res = diesel::update(suppliers.filter(id.eq(supplier_id)))
        .set((
            is_reviewed.eq(item.is_reviewed),
            is_approved.eq(item.is_approved),
            is_audited.eq(item.is_audited),
        ))
        .execute(&mut conn);

    match res {
        Ok(_) => HttpResponse::Ok().json("Estado de cumplimiento actualizado"),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}
