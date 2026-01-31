use actix_multipart::Multipart;
use actix_web::{web, Error, HttpResponse, Responder};
use futures_util::{StreamExt, TryStreamExt};
use std::io::Write;
use uuid::Uuid;

pub async fn upload_file(mut payload: Multipart) -> Result<HttpResponse, Error> {
    let mut filename = String::new();
    
    // Iterate over multipart stream
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.map(|cd| cd.get_name().unwrap_or("")).unwrap_or("");
        
        if field_name == "file" {
            let original_filename = field.content_disposition()
                .and_then(|cd| cd.get_filename().map(|s| s.to_string()))
                .unwrap_or_else(|| "file".to_string());
                
            let extension = original_filename.split('.').last().unwrap_or("bin");
            let new_filename = format!("{}.{}", Uuid::new_v4(), extension);
            filename = new_filename.clone();
            
            let upload_dir = "./uploads";
            if !std::path::Path::new(upload_dir).exists() {
                std::fs::create_dir_all(upload_dir)?;
            }

            let filepath = format!("{}/{}", upload_dir, new_filename);
            
            // File::create is blocking, in a real production app use spawn_blocking
            let mut f = std::fs::File::create(filepath)?;
            
            // Field in turn is stream of *Bytes* object
            while let Some(chunk) = field.next().await {
                let data = chunk?;
                f.write_all(&data)?;
            }
        }
    }

    if filename.is_empty() {
        return Ok(HttpResponse::BadRequest().body("No file found in payload"));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "file": filename })))
}
