import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  discordRPCEnabled: boolean;
  onDiscordRPCToggle: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  discordRPCEnabled,
  onDiscordRPCToggle
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>Discord Integration</h3>
            <div className="setting-item">
              <div className="setting-info">
                <label htmlFor="discord-rpc">Discord Rich Presence</label>
                <p className="setting-description">
                  Show what you're listening to in Discord
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    id="discord-rpc"
                    type="checkbox"
                    checked={discordRPCEnabled}
                    onChange={(e) => onDiscordRPCToggle(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 