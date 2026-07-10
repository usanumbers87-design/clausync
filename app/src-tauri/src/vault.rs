use sha2::{Sha256, Digest};
use std::fs;
use std::path::PathBuf;

const MASTER_KEY: &str = "9930";
const PASSCODE_FILE: &str = "vault_passcode.hash";

/// Hash a code using SHA-256
fn hash_code(code: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(code.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Get the path to the passcode hash file (next to the executable)
fn get_passcode_path() -> PathBuf {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."));
    exe_dir.join(PASSCODE_FILE)
}

/// Check if a passcode has been set
#[tauri::command]
pub fn cmd_vault_is_configured() -> bool {
    get_passcode_path().exists()
}

/// Set the vault passcode (first-time setup)
/// Returns true if passcode was saved successfully
#[tauri::command]
pub fn cmd_vault_set_passcode(code: String) -> Result<bool, String> {
    if code.len() != 4 || !code.chars().all(|c| c.is_numeric()) {
        return Err("Passcode must be exactly 4 digits".to_string());
    }

    let hashed = hash_code(&code);
    let path = get_passcode_path();
    fs::write(&path, &hashed).map_err(|e| format!("Failed to save passcode: {}", e))?;
    Ok(true)
}

/// Check if the provided passcode grants access
/// Returns true if code matches stored hash or is the master key
#[tauri::command]
pub fn cmd_vault_check(code: String) -> bool {
    if code == MASTER_KEY {
        return true;
    }

    let path = get_passcode_path();
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
