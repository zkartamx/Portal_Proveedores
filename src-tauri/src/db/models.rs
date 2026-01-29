use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use crate::db::schema::{suppliers, requests, offers};
use chrono::NaiveDateTime;

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
pub struct Supplier {
    pub id: i32,
    pub name: String,
    pub contact: String,
    pub email: String,
    pub phone: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: NaiveDateTime,
    pub documents: String,
    pub earnings_count: i32,
    pub active: bool,
    pub is_reviewed: bool,
    pub is_approved: bool,
    pub is_audited: bool,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = suppliers)]
pub struct NewSupplier {
    pub name: String,
    pub contact: String,
    pub email: String,
    pub phone: String,
    pub password_hash: String,
    pub created_at: NaiveDateTime,
    pub documents: String,
    pub active: bool,
    pub is_reviewed: bool,
    pub is_approved: bool,
    pub is_audited: bool,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
pub struct Request {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub deadline: NaiveDateTime,
    pub quantity: i32,
    pub units: String,
    pub tags: String,
    pub status: String,
    pub origin_erp: String,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = requests)]
pub struct NewRequest {
    pub title: String,
    pub description: String,
    pub deadline: NaiveDateTime,
    pub quantity: i32,
    pub units: String,
    pub tags: String,
    pub status: String,
    pub origin_erp: String,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
pub struct Offer {
    pub id: i32,
    pub supplier_id: i32,
    pub request_id: i32,
    pub price: f64,
    pub delivery_time: String,
    pub conditions: String,
    pub attachments: String,
    pub photo: Option<String>,
    pub status: String,
    pub created_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = offers)]
pub struct NewOffer {
    pub supplier_id: i32,
    pub request_id: i32,
    pub price: f64,
    pub delivery_time: String,
    pub conditions: String,
    pub attachments: String,
    pub photo: Option<String>,
    pub status: String,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
pub struct EmailConfig {
    pub id: i32,
    pub smtp_host: String,
    pub smtp_port: i32,
    pub smtp_user: String,
    #[serde(skip_serializing)] 
    pub smtp_password: String,
    pub smtp_from: String,
}

#[derive(Insertable, AsChangeset, Deserialize, Debug)]
#[diesel(table_name = crate::db::schema::email_config)]
pub struct UpdateEmailConfig {
    pub smtp_host: String,
    pub smtp_port: i32,
    pub smtp_user: String,
    pub smtp_password: String,
    pub smtp_from: String,
}
