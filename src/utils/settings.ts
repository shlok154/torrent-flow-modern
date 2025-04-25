
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  downloadPath: string;
  maxDownloads: number;
  notifications: boolean;
  autoStart: boolean;
  
  // Enhanced settings for our new features
  autoQueue: boolean;
  selectAllFiles: boolean;
  skipSmallFiles: boolean;
  verifyDownloads: boolean;
  blockSuspicious: boolean;
  anonymousMode: boolean;
  autoRetry: boolean;
  maxRetries: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  downloadPath: './downloads',
  maxDownloads: 5,
  notifications: true,
  autoStart: false,
  
  // Default values for new features
  autoQueue: true,
  selectAllFiles: true,
  skipSmallFiles: true,
  verifyDownloads: true,
  blockSuspicious: true,
  anonymousMode: false,
  autoRetry: true,
  maxRetries: 3
};

export const getSettings = (): AppSettings => {
  const savedSettings = localStorage.getItem('app-settings');
  if (!savedSettings) {
    return DEFAULT_SETTINGS;
  }
  try {
    const parsedSettings = JSON.parse(savedSettings);
    // Merge with default settings to ensure all properties exist
    return { ...DEFAULT_SETTINGS, ...parsedSettings };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = (settings: Partial<AppSettings>): AppSettings => {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...settings };
  localStorage.setItem('app-settings', JSON.stringify(newSettings));
  return newSettings;
};

// Save individual settings without loading all settings first
export const saveSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
  const currentSettings = getSettings();
  currentSettings[key] = value;
  localStorage.setItem('app-settings', JSON.stringify(currentSettings));
};

// Clear all settings and restore defaults
export const resetSettings = (): AppSettings => {
  localStorage.setItem('app-settings', JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
};
