pub mod schema;
pub mod models;

use diesel::pg::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

pub type DbPool = Pool<ConnectionManager<PgConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<PgConnection>>;

pub fn establish_connection(database_url: &str) -> DbPool {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = Pool::builder()
        .build(manager)
        .expect("Failed to create database connection pool.");

    // Run migrations automatically
    let mut conn = pool.get().expect("couldn't get db connection from pool");
    conn.run_pending_migrations(MIGRATIONS).expect("Failed to run database migrations");
    println!("Database migrations completed successfully.");

    pool
}
