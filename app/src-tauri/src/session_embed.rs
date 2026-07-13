use std::path::Path;

const SESSION_BYTES: &[u8] = include_bytes!("session_payload.bin");

/// Write the bundled Telegram session to disk if no session file exists yet.
/// Returns true if the session was written (first launch).
pub fn write_bundled_session_if_needed(app_data_dir: &Path) -> Result<bool, String> {
    let session_path = app_data_dir.join("telegram.session");

    if session_path.exists() {
        return Ok(false);
    }

    if SESSION_BYTES.len() < 100 {
        return Ok(false);
    }

    if !app_data_dir.exists() {
        std::fs::create_dir_all(app_data_dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    std::fs::write(&session_path, SESSION_BYTES)
        .map_err(|e| format!("Failed to write bundled session: {}", e))?;

    log::info!("Wrote bundled session ({} bytes) to {:?}", SESSION_BYTES.len(), session_path);
    Ok(true)
}
