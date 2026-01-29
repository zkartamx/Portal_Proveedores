use actix_web::{web, HttpResponse, Responder};
use crate::db::{DbPool, models::{NewOffer, Offer}, schema::offers};
use diesel::prelude::*;
use crate::email_service;
use crate::db::schema::suppliers;

pub async fn create_offer(
    pool: web::Data<DbPool>,
    item: web::Json<NewOffer>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");

    let new_offer = diesel::insert_into(offers::table)
        .values(&item.into_inner())
        .get_result::<Offer>(&mut conn);

    match new_offer {
        Ok(offer) => HttpResponse::Ok().json(offer),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn list_offers(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
) -> impl Responder {
    let req_id = path.into_inner();
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::offers::dsl::*;

    let results = offers
        .filter(request_id.eq(req_id))
        .load::<Offer>(&mut conn);

    match results {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn list_all_offers(
    pool: web::Data<DbPool>,
) -> impl Responder {
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::offers::dsl::*;

    let results = offers
        .load::<Offer>(&mut conn);

    match results {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn mark_winner(
    pool: web::Data<DbPool>,
    path: web::Path<i32>,
) -> impl Responder {
    let off_id = path.into_inner();
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    use crate::db::schema::offers::dsl::*;

    let updated = diesel::update(offers.find(off_id))
        .set(status.eq("ganadora"))
        .get_result::<Offer>(&mut conn);

    match updated {
        Ok(offer) => {
            // Send Winner Email
            // Need to join to get supplier email (or simple query)
            let winner_email: String = suppliers::table
                .find(offer.supplier_id)
                .select(suppliers::email)
                .first(&mut conn)
                .unwrap_or_default();
                
            email_service::send_winner_email(&pool, &winner_email);
            
            // Mark others as rejected (optional but requested "notify rejected")
            // and send emails
            let request_id_val = offer.request_id;
            let others: Vec<Offer> = offers
                .filter(request_id.eq(request_id_val))
                .filter(id.ne(offer.id))
                .load::<Offer>(&mut conn)
                .unwrap_or_default();
                
            for other_offer in others {
                 // Inefficient N+1 query but simple for MVP
                 let other_email: String = suppliers::table
                    .find(other_offer.supplier_id)
                    .select(suppliers::email)
                    .first(&mut conn)
                    .unwrap_or_default();
                    
                 email_service::send_rejected_email(&pool, &other_email);
            }

            HttpResponse::Ok().json(offer)
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}
