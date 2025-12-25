use discord_rich_presence::{
    activity::{Activity, ActivityType, Button, Timestamps},
    DiscordIpc, DiscordIpcClient,
};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::Instant;

pub struct DiscordRPCManager {
    client: Arc<Mutex<Option<DiscordIpcClient>>>,
    start_time: Arc<Mutex<Option<Instant>>>,
}

impl DiscordRPCManager {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
            start_time: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn connect(&self) -> Result<(), String> {
        let mut client_guard = self.client.lock().await;

        if client_guard.is_some() {
            return Ok(());
        }

        let mut client = DiscordIpcClient::new("1376904142412316812")
            .map_err(|e| format!("Failed to create Discord client: {}", e))?;

        client
            .connect()
            .map_err(|e| format!("Failed to connect to Discord: {}", e))?;

        *client_guard = Some(client);
        *self.start_time.lock().await = Some(Instant::now());

        Ok(())
    }

    pub async fn update_activity(
        &self,
        station_name: &str,
        tags: Option<&str>,
    ) -> Result<(), String> {
        let mut client_guard = self.client.lock().await;
        let start_time_guard = self.start_time.lock().await;

        if let (Some(client), Some(start_time)) = (client_guard.as_mut(), *start_time_guard) {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| format!("Time error: {}", e))?;

            let elapsed = start_time.elapsed();
            let start_timestamp = now.as_secs() - elapsed.as_secs();

            let details = format!("📻 {}", station_name);
            let state = tags.map(|t| format!("🎵 {}", t));

            let mut activity = Activity::new()
                .details(&details)
                .activity_type(ActivityType::Listening)
                .timestamps(Timestamps::new().start(start_timestamp as i64))
                .assets(
                    discord_rich_presence::activity::Assets::new()
                        .large_image("radio_icon")
                        .large_text("Radioss - Internet Radio Player"),
                )
                .buttons(vec![Button::new(
                    "🔗 Get Radioss",
                    "https://github.com/DasCanard/radioss/releases",
                )]);

            if let Some(ref state_text) = state {
                activity = activity.state(state_text);
            }

            client
                .set_activity(activity)
                .map_err(|e| format!("Failed to set activity: {}", e))?;
        }

        Ok(())
    }

    pub async fn clear_activity(&self) -> Result<(), String> {
        let mut client_guard = self.client.lock().await;

        if let Some(client) = client_guard.as_mut() {
            client
                .clear_activity()
                .map_err(|e| format!("Failed to clear activity: {}", e))?;
        }

        Ok(())
    }

    pub async fn disconnect(&self) -> Result<(), String> {
        let mut client_guard = self.client.lock().await;
        let mut start_time_guard = self.start_time.lock().await;

        if let Some(mut client) = client_guard.take() {
            let _ = client.close(); // Ignoriere Fehler beim Schließen
        }

        *start_time_guard = None;

        Ok(())
    }
}
