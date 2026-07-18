// ============================================================================
// DOWNLOADS DATA STORE (downloadsData.js)
// Centralized list of downloadable applications and their version histories.
// ============================================================================

export const DOWNLOADABLE_APPS = [
  {
    id: 'retrop-rms',
    name: 'Retrop RMS',
    iconName: 'ChefHat',
    tagline: 'Restaurant Management System Mobile App',
    category: 'Mobile Application',
    platform: 'Android (APK)',
    fileSize: '126 MB',
    minAndroid: 'Android 8.0 (Oreo) or higher',
    description: 'Retrop RMS (Restaurant Management System) is our flagship mobile application built specifically for Android devices. It streamlines table management, digitalizes waiter orders, and coordinates kitchen workflows in real-time.',
    versions: [
      {
        version: 'v1.0.0',
        releaseDate: 'July 18, 2026',
        downloadUrl: 'https://github.com/SonuuChowdhury/Retrop-Releases/releases/download/Retrop-RMS-v1.0.0/Retrop.RMS.v1.0.0.apk',
        fileSize: '126 MB',
        changelog: [
          'Initial public release of Retrop RMS mobile app.',
          'Live table layout editor and real-time ordering.',
          'Kitchen order tickets (KOT) routing to food preparation areas.',
          'Multi-user staff logins with role-based permissions.'
        ]
      }
    ]
  }
];
