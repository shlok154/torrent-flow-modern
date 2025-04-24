
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  downloadPath: string;
  maxDownloads: number;
  notifications: boolean;
  autoStart: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  downloadPath: './downloads',
  maxDownloads: 5,
  notifications: true,
  autoStart: false,
};

export const getSettings = (): AppSettings => {
  const savedSettings = localStorage.getItem('app-settings');
  if (!savedSettings) {
    return DEFAULT_SETTINGS;
  }
  try {
    return JSON.parse(savedSettings);
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

