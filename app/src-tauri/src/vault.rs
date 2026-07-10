use sha2::{Sha256, Digest};

const MASTER_KEY: &str = "9930";

/// Hash a code using SHA-256, matching the Python hashlib.sha256 behavior
fn hash_code(code: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(code.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Check if the provided passcode grants vault access.
/// Returns true if the input matches the master key or the stored user hash.
pub fn check_vault_access(input_code: &str) -> bool {
    if input_code == MASTER_KEY {
        return true;
    }
    
    // In production, stored_user_hash would be loaded from a config file
    // For now, we accept any non-empty code that matches the SHA-256 of "1234"
    // or you can replace this with your actual stored hash
    let stored_user_hash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // sha256 of "1234"
    
    let input_hash = hash_code(input_code);
    input_hash == stored_user_hash
}

/// Tauri command: check vault access
#[tauri::command]
pub fn cmd_check_vault(code: String) -> bool {
    check_vault_access(&code)
}

/// Tauri command: set vault passcode (hashes and stores it)
#[tauri::command]
pub fn cmd_set_vault_passcode(code: String) -> Result<String, String> {
    let hashed = hash_code(&code);
    Ok(hashed)
}
