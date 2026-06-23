const { withAndroidManifest } = require('@expo/config-plugins');

const withTrackPlayerTurboModuleFix = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    
    const mainApplication = manifest.manifest.application[0];
    if (!mainApplication.$['android:name']) {
      mainApplication.$['android:name'] = 
        'com.doublesymmetry.trackplayer.TrackPlayerModule';
    }
    
    const activities = Array.isArray(manifest.manifest.activity) 
      ? manifest.manifest.activity 
      : [manifest.manifest.activity].filter(Boolean);
    
    activities.forEach((activity) => {
      if (!activity['intent-filter']) return;
      const filters = Array.isArray(activity['intent-filter']) 
        ? activity['intent-filter'] 
        : [activity['intent-filter']];
      filters.forEach((filter) => {
        if (filter.action?.$?.['android:name'] === 'android.intent.action.MAIN') {
          if (!filter['android:exported']) {
            filter['android:exported'] = 'true';
          }
        }
      });
    });
    
    return config;
  });
};

module.exports = withTrackPlayerTurboModuleFix;