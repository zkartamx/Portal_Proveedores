diesel::table! {
    email_config (id) {
        id -> Int4,
        smtp_host -> Varchar,
        smtp_port -> Int4,
        smtp_user -> Varchar,
        smtp_password -> Varchar,
        smtp_from -> Varchar,
        ui_theme -> Varchar,
    }
}

diesel::table! {
    suppliers (id) {
        id -> Int4,
        name -> Varchar,
        contact -> Varchar,
        email -> Varchar,
        phone -> Varchar,
        password_hash -> Varchar,
        created_at -> Timestamp,
        documents -> Text,
        earnings_count -> Int4,
        active -> Bool,
        is_reviewed -> Bool,
        is_approved -> Bool,
        is_audited -> Bool,
    }
}

diesel::table! {
    requests (id) {
        id -> Int4,
        title -> Varchar,
        description -> Text,
        deadline -> Timestamp,
        quantity -> Int4,
        units -> Varchar,
        tags -> Text,
        status -> Varchar,
        origin_erp -> Varchar,
    }
}

diesel::table! {
    offers (id) {
        id -> Int4,
        supplier_id -> Int4,
        request_id -> Int4,
        price -> Float8,
        delivery_time -> Varchar,
        conditions -> Text,
        attachments -> Text,
        photo -> Nullable<Text>,
        status -> Varchar,
        created_at -> Timestamp,
    }
}

diesel::joinable!(offers -> suppliers (supplier_id));
diesel::joinable!(offers -> requests (request_id));

diesel::allow_tables_to_appear_in_same_query!(
    email_config,
    suppliers,
    requests,
    offers,
);
