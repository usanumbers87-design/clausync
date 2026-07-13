use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoSyncConfig {
    pub enabled: bool,
    pub watched_folders: Vec<String>,
}

impl Default for AutoSyncConfig {
    fn default() -> Self {
        let folders = detect_default_folders();
        log::info!("Auto-sync default folders: {:?}", folders);
        Self { enabled: true, watched_folders: folders }
    }
}

fn detect_default_folders() -> Vec<String> {
    let mut folders = Vec::new();
    if let Ok(profile) = std::env::var("USERPROFILE") {
        let base = std::path::PathBuf::from(&profile);
        let checks = [
            "Pictures/Camera Roll",
            "DCIM",
            "Downloads",
            "Desktop",
        ];
        for c in &checks {
            let p = base.join(c);
            if p.exists() { folders.push(p.to_string_lossy().to_string()); }
        }
    }
    folders
}

pub struct AutoSyncState {
    pub config: tokio::sync::RwLock<AutoSyncConfig>,
    pub running: Arc<AtomicBool>,
}

fn is_media(ext: &str) -> bool {
    matches!(ext, "jpg"|"jpeg"|"png"|"gif"|"bmp"|"webp"|"heic"|"heif"
        |"mp4"|"mov"|"avi"|"mkv"|"webm"|"3gp"|"m4v")
}

#[tauri::command]
pub async fn cmd_get_auto_sync_config(
    state: tauri::State<'_, Arc<AutoSyncState>>,
) -> Result<AutoSyncConfig, String> {
    Ok(state.config.read().await.clone())
}

#[tauri::command]
pub async fn cmd_auto_sync_start(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, Arc<AutoSyncState>>,
) -> Result<(), String> {
    if state.running.load(Ordering::SeqCst) {
        log::info!("Auto-sync already running");
        return Ok(());
    }

    let config = state.config.read().await.clone();
    if !config.enabled || config.watched_folders.is_empty() {
        log::info!("Auto-sync: disabled or no folders");
        return Ok(());
    }

    log::info!("Auto-sync starting (polling mode)...");
    state.running.store(true, Ordering::SeqCst);

    let app = app_handle.clone();
    let folders = config.watched_folders.clone();
    let running = state.running.clone();

    tauri::async_runtime::spawn(async move {
        let mut seen: HashSet<String> = HashSet::new();
        log::info!("Auto-sync poller started");

        while running.load(Ordering::SeqCst) {
            for folder in &folders {
                let dir = std::path::Path::new(folder);
                if !dir.exists() { continue; }
                match std::fs::read_dir(dir) {
                    Ok(entries) => {
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if !path.is_file() { continue; }
                            let ext = path.extension()
                                .and_then(|e| e.to_str())
                                .map(|e| e.to_lowercase())
                                .unwrap_or_default();
                            if !is_media(&ext) { continue; }
                            let path_str = path.to_string_lossy().to_string();
                            if seen.contains(&path_str) { continue; }
                            let size = std::fs::metadata(&path).ok().map(|m| m.len()).unwrap_or(0);
                            if size < 1024 { continue; }
                            seen.insert(path_str.clone());
                            log::info!("Auto-sync found: {} ({} bytes)", path_str, size);
                            let _ = app.emit("auto-sync-new-file", serde_json::json!({
                                "path": path_str,
                                "size": size,
                            }));
                        }
                    }
                    Err(e) => {
                        log::error!("Auto-sync: cannot read {}: {}", folder, e);
                    }
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(30)).await;
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cmd_auto_sync_stop(
    state: tauri::State<'_, Arc<AutoSyncState>>,
) -> Result<(), String> {
    state.running.store(false, Ordering::SeqCst);
    log::info!("Auto-sync stopped");
    Ok(())
}
