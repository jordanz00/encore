// Encore desktop — Tauri 2 entry.
//
// Wraps the Encore web app at http://localhost:3000 in a native window
// with system media keys, mini-player, and tray. Per RFC 007.

#[tauri::command]
fn ping() -> &'static str {
    "encore-desktop"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
