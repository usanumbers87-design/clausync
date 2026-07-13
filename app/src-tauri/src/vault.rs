use sha2::{Sha256, Digest};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const MASTER_KEY: &str = "9930";
const PASSCODE_FILE: &str = "vault_passcode.hash";

/// Hash a code using SHA-256
fn hash_code(code: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(code.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Get the path to the passcode hash file in the app data directory
fn get_passcode_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    if !dir.exists() {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }
    Ok(dir.join(PASSCODE_FILE))
}

/// Check if a passcode has been set
#[tauri::command]
pub fn cmd_vault_is_configured(app_handle: tauri::AppHandle) -> bool {
    match get_passcode_path(&app_handle) {
        Ok(path) => path.exists(),
        Err(_) => false,
    }
}

/// Set the vault passcode (first-time setup)
/// Returns true if passcode was saved successfully
#[tauri::command]
pub fn cmd_vault_set_passcode(app_handle: tauri::AppHandle, code: String) -> Result<bool, String> {
    if code.len() != 4 || !code.chars().all(|c| c.is_numeric()) {
        return Err("Passcode must be exactly 4 digits".to_string());
    }

    let hashed = hash_code(&code);
    let path = get_passcode_path(&app_handle)?;
    fs::write(&path, &hashed).map_err(|e| format!("Failed to save passcode: {}", e))?;
    Ok(true)
}

/// Check if the provided passcode grants access
/// Returns true if code matches stored hash or is the master key
#[tauri::command]
pub fn cmd_vault_check(app_handle: tauri::AppHandle, code: String) -> bool {
    if code == MASTER_KEY {
        return true;
    }

    let path = match get_passcode_path(&app_handle) {
        Ok(p) => p,
        Err(_) => return false,
    };
    if !path.exists() {
        return false;
    }

    let stored_hash = match fs::read_to_string(&path) {
        Ok(h) => h.trim().to_string(),
        Err(_) => return false,
    };

    let input_hash = hash_code(&code);
    input_hash == stored_hash
}
