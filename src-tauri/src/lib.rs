mod discord;

use discord::DiscordRPCManager;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;

// Global Discord RPC Manager
type DiscordState = Arc<Mutex<DiscordRPCManager>>;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn discord_connect(discord_manager: State<'_, DiscordState>) -> Result<(), String> {
    let manager = discord_manager.lock().await;
    manager.connect().await
}

#[tauri::command]
async fn discord_update_activity(
    discord_manager: State<'_, DiscordState>,
    station_name: String,
    tags: Option<String>,
) -> Result<(), String> {
    let manager = discord_manager.lock().await;
    manager.update_activity(&station_name, tags.as_deref()).await
}

#[tauri::command]
async fn discord_clear_activity(discord_manager: State<'_, DiscordState>) -> Result<(), String> {
    let manager = discord_manager.lock().await;
    manager.clear_activity().await
}

#[tauri::command]
async fn discord_disconnect(discord_manager: State<'_, DiscordState>) -> Result<(), String> {
    let manager = discord_manager.lock().await;
    manager.disconnect().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let discord_manager: DiscordState = Arc::new(Mutex::new(DiscordRPCManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(discord_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            discord_connect,
            discord_update_activity,
            discord_clear_activity,
            discord_disconnect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
