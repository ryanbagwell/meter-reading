export default {
  serviceAccount: process.env.FIREBASE_SERVER_CREDENTIALS_PATH || 'credentials.json',
  databaseURL: 'https://glaring-fire-6854.firebaseio.com/',
  apiKey: 'AIzaSyDm4pY8-iMZt5WuSzVHH1TZJogQxI48xJI',
  devices: [
    {
      msgType: 'scm',
      deviceId: '43000657',
      category: 'electric',
      units: 'kw/h',
      costPerUnit: 0.22,
      decimalPlaces: 2,
    },
    {
      msgType: 'r900',
      deviceId: '1541531110',
      category: 'water',
      units: 'ft³',
      costPerUnit: 0.1628,
      decimalPlaces: 2,
    },
  ],
};
