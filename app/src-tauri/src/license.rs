use ed25519_compact::{PublicKey, Signature};

const LICENSE_PREFIX: &str = "CLAUSYNC-";
const PUBLIC_KEY_B64: &str = "_bTP14wYLFq5lqH5n2s7oNq1mCTZ91RGSh-cgJ1lqGQ";

fn base64url_decode(input: &str) -> Result<Vec<u8>, String> {
    let normalized = input.replace('-', "+").replace('_', "/");
    let padded = match normalized.len() % 4 {
        0 => normalized,
        r => normalized + &"=".repeat(4 - r),
    };
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(&padded)
        .map_err(|e| format!("Base64 decode error: {}", e))
}

fn verify_license_key(key: &str) -> Result<serde_json::Value, String> {
    let b64_data = key
        .strip_prefix(LICENSE_PREFIX)
        .ok_or_else(|| "Invalid license key: missing CLAUSYNC- prefix".to_string())?;

    let decoded = base64url_decode(b64_data)?;
    if decoded.len() <= 64 {
        return Err("License key too short".to_string());
    }

    let sig_bytes = &decoded[..64];
    let payload_bytes = &decoded[64..];

    let pk_bytes = base64url_decode(PUBLIC_KEY_B64)?;
    if pk_bytes.len() != 32 {
        return Err("Invalid public key length".to_string());
    }

    let pk = PublicKey::from_slice(&pk_bytes)
        .map_err(|e| format!("Invalid public key: {}", e))?;
    let sig = Signature::from_slice(sig_bytes)
        .map_err(|e| format!("Invalid signature: {}", e))?;

    pk.verify(payload_bytes, &sig)
        .map_err(|_| "License key verification failed".to_string())?;

    let payload: serde_json::Value = serde_json::from_slice(payload_bytes)
        .map_err(|e| format!("Invalid payload JSON: {}", e))?;

    if let Some(exp) = payload.get("exp").and_then(|v| v.as_i64()) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        if now > exp {
            return Err("License key has expired".to_string());
        }
    }

    Ok(payload)
}

fn ensure_table(conn: &sqlite::Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT)",
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_check_license(db: tauri::State<crate::db::DbConnection>) -> Result<bool, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    ensure_table(&conn)?;

    let mut stmt = conn
        .prepare("SELECT COUNT(*) FROM admin_settings WHERE key = ?")
        .map_err(|e| e.to_string())?;
    stmt.bind((1, "activated_license"))
        .map_err(|e| e.to_string())?;
    stmt.next().map_err(|e| e.to_string())?;
    let count: i64 = stmt.read(0).unwrap_or(0);
    Ok(count > 0)
}

#[tauri::command]
pub fn cmd_activate_license(
    key: String,
    db: tauri::State<crate::db::DbConnection>,
) -> Result<String, String> {
    let payload = verify_license_key(&key)?;
    let user = payload
        .get("sub")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");

    let conn = db.lock().map_err(|e| e.to_string())?;
    ensure_table(&conn)?;

    let mut stmt = conn
        .prepare("INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)")
        .map_err(|e| e.to_string())?;
    stmt.bind((1, "activated_license"))
        .map_err(|e| e.to_string())?;
    stmt.bind((2, key.as_str()))
        .map_err(|e| e.to_string())?;
    stmt.next().map_err(|e| e.to_string())?;

    let info_json = serde_json::to_string(&payload).map_err(|e| e.to_string())?;
    let mut stmt2 = conn
        .prepare("INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)")
        .map_err(|e| e.to_string())?;
    stmt2
        .bind((1, "activated_license_info"))
        .map_err(|e| e.to_string())?;
    stmt2
        .bind((2, info_json.as_str()))
        .map_err(|e| e.to_string())?;
    stmt2.next().map_err(|e| e.to_string())?;

    Ok(format!("License activated for {}", user))
}

#[tauri::command]
pub fn cmd_get_license_info(
    db: tauri::State<crate::db::DbConnection>,
) -> Result<serde_json::Value, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM admin_settings WHERE key = ?")
        .map_err(|e| e.to_string())?;
    stmt.bind((1, "activated_license_info"))
        .map_err(|e| e.to_string())?;
    match stmt.next().map_err(|e| e.to_string())? {
        sqlite::State::Row => {
            let val: String = stmt.read(0).map_err(|e| e.to_string())?;
            serde_json::from_str(&val).map_err(|e| e.to_string())
        }
        _ => Err("No license info found".to_string()),
    }
}
