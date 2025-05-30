mod discord;

use discord::DiscordRPCManager;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{State, Manager, AppHandle};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}
};

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
            hide_window
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
