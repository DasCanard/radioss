import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RadioStation } from '../types';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (station: RadioStation) => void;
}

export const AddStationModal: React.FC<AddStationModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd 
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    const newStation: RadioStation = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      isCustom: true
    };

    onAdd(newStation);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setUrl('');
    setTags('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Custom Station</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Station Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Favorite Station"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">Stream URL *</label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://stream.example.com/radio.mp3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Rock, Pop, Jazz"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Station
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 