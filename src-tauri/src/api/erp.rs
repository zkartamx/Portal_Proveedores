use actix_web::{web, HttpResponse, Responder, HttpRequest};
use serde::{Deserialize, Serialize};
use crate::db::models::{NewRequest};
use crate::db::schema::requests;
use diesel::prelude::*;
use chrono::NaiveDateTime;

#[derive(Deserialize, Debug)]
pub struct ErpRequestItem {
    pub external_id: String,
    pub title: String,
    pub description: String,
    pub quantity: i32,
    pub units: String,
    pub deadline: Option<String>, // ISO string from JSON
    pub tags: Option<String>,
}

use crate::db::DbPool;

#[derive(Serialize)]
pub struct ImportResponse {
    status: String,
    message: String,
    processed: usize,
}

pub async fn import_requests(
    pool: web::Data<DbPool>,
    req: HttpRequest, 
    items: web::Json<Vec<ErpRequestItem>>
) -> impl Responder {
    // 1. Simple API Key Check
    let api_key = match req.headers().get("X-API-KEY") {
        Some(k) => k.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().body("Missing X-API-KEY"),
    };

    // TODO: Move to config/env
    if api_key != "secret-erp-key" {
        return HttpResponse::Unauthorized().body("Invalid API Key");
    }

    let mut connection = pool.get().expect("couldn't get db connection from pool");
    let mut count = 0;

    for item in items.iter() {
        // Parse deadline or default to now + 7 days
        let deadline_dt = if let Some(d) = &item.deadline {
             NaiveDateTime::parse_from_str(d, "%Y-%m-%dT%H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local())
        } else {
             chrono::Local::now().naive_local()
        };

        let new_req = NewRequest {
            title: item.title.clone(),
            description: item.description.clone(),
            deadline: deadline_dt,
            quantity: item.quantity,
            units: item.units.clone(),
            tags: item.tags.clone().unwrap_or_default(),
            status: "open".to_string(),
            origin_erp: item.external_id.clone(),
        };

        // Upsert logic (simplified: check if external_id exists, else insert)
        // Note: For true upsert we need unique constraint on origin_erp. 
        // For MVP we just insert. Ideally we should check if exists.
        
        // Check if exists
        use crate::db::schema::requests::dsl::*;
        let existing: i64 = requests
            .filter(origin_erp.eq(&item.external_id))
            .count()
            .get_result(&mut connection)
            .unwrap_or(0);

        if existing == 0 {
             diesel::insert_into(requests)
                .values(&new_req)
                .execute(&mut connection)
                .unwrap_or(0);
             count += 1;
        }
    }

    HttpResponse::Ok().json(ImportResponse {
        status: "success".to_string(),
        message: format!("Imported {} requests", count),
        processed: count,
    })
}
