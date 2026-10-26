export const environment = {
  primeLicenseKey: '',
  // Wird per Dev-Proxy (proxy.conf.json) an http://localhost:8080/inventarbuddy weitergeleitet
  apiUrl: '/api',
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'inventarbuddy',
    clientId: 'inventarbuddy-frontend',
  },
};
