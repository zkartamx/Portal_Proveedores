use actix_web::{web, HttpResponse, Responder};
use crate::db::{DbPool, models::{NewRequest, Request}, schema::requests};
use diesel::prelude::*;

pub async fn create_request(
    pool: web::Data<DbPool>,
    item: web::Json<NewRequest>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");

    let new_request = diesel::insert_into(requests::table)
        .values(&item.into_inner())
        .get_result::<Request>(&mut conn);

    match new_request {
        Ok(req) => HttpResponse::Ok().json(req),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn list_requests(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::requests::dsl::*;

    // Default to published or all, prompt says "lista abierta"
    // ERP imports are 'open', legacy manual might be 'published'
    let results = requests
        .filter(status.eq("open").or(status.eq("published")))
        .load::<Request>(&mut conn);

    match results {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}
