mod discord;

use discord::DiscordRPCManager;
use serde_json::{json, Value};
use std::fs;
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;

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
    manager
        .update_activity(&station_name, tags.as_deref())
        .await
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

#[tauri::command]
async fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn save_data(app: AppHandle, data_type: String, data: Value) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Could not get app data directory: {}", e))?;

    // Create app data directory if it doesn't exist
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let file_path = app_dir.join(format!("{}.json", data_type));
    println!("🔧 SAVING DATA: {} -> {}", data_type, file_path.display());

    let json_string = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;

    let json_len = json_string.len();
    fs::write(&file_path, &json_string).map_err(|e| e.to_string())?;
    println!(
        "✅ SUCCESSFULLY SAVED: {} ({} bytes)",
        file_path.display(),
        json_len
    );
    Ok(())
}

#[tauri::command]
async fn load_data(app: AppHandle, data_type: String) -> Result<Value, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Could not get app data directory: {}", e))?;

    // Create app data directory if it doesn't exist
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let file_path = app_dir.join(format!("{}.json", data_type));
    println!("📂 LOADING DATA: {} <- {}", data_type, file_path.display());

    if !file_path.exists() {
        println!(
            "⚠️  FILE NOT FOUND: {} (creating default config)",
            file_path.display()
        );

        // Create default configuration based on data type
        let default_data = match data_type.as_str() {
            "customStations" => json!([]),
            "favorites" => json!([]),
            "favoritedStations" => json!([]),
            "volume" => json!(50),
            "discordRPCEnabled" => json!(true),
            "minimizeToTrayEnabled" => json!(false),
            _ => json!(null),
        };

        // Save the default configuration
        let json_string = serde_json::to_string_pretty(&default_data).map_err(|e| e.to_string())?;

        fs::write(&file_path, &json_string).map_err(|e| e.to_string())?;
        println!(
            "✅ CREATED DEFAULT CONFIG: {} ({} bytes)",
            file_path.display(),
            json_string.len()
        );

        return Ok(default_data);
    }

    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    println!(
        "✅ SUCCESSFULLY LOADED: {} ({} bytes)",
        file_path.display(),
        content.len()
    );
    let data: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(data)
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
            discord_disconnect,
            show_window,
            hide_window,
            save_data,
            load_data
        ])
        .setup(|app| {
            // Create tray menu
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Show Radioss", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Create tray icon with app icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Radioss - Click to show/hide")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        println!("Quit menu item clicked");
                        app.exit(0);
                    }
                    "show" => {
                        println!("Show menu item clicked");
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                        }
                    }
                    _ => {
                        println!("Menu item {:?} not handled", event.id);
                    }
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        println!("Left click on tray icon");
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            match window.is_visible() {
                                Ok(visible) => {
                                    if visible {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                        let _ = window.unminimize();
                                    }
                                }
                                Err(_) => {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    }
                    TrayIconEvent::DoubleClick {
                        button: MouseButton::Left,
                        ..
                    } => {
                        println!("Double click on tray icon");
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                        }
                    }
                    _ => {
                        // println!("Unhandled tray event: {:?}", event);
                    }
                })
                .build(app)?;

            println!("System tray created successfully!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
