use actix_web::{web, HttpResponse, Responder};
use crate::db::{DbPool, schema::suppliers};
use diesel::prelude::*;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateDocsInput {
    pub documents: String,
}

pub async fn update_docs(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
    item: web::Json<UpdateDocsInput>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    let supplier_id = path.into_inner();

    let res = diesel::update(suppliers::table.filter(suppliers::id.eq(supplier_id)))
        .set(suppliers::documents.eq(&item.documents))
        .execute(&mut conn);

    match res {
        Ok(_) => HttpResponse::Ok().json("Documentación actualizada correctamente"),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn get_supplier(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    let supplier_id = path.into_inner();

    let res = crate::db::schema::suppliers::table
        .find(supplier_id)
        .first::<crate::db::models::Supplier>(&mut conn);

    match res {
        Ok(s) => HttpResponse::Ok().json(s),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}
