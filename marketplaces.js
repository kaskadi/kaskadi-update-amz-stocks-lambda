// only marketplaces which returns meaningful data are saved here
module.exports = {
  DE: { name: 'Germany', sc: 'DE', endpoint: 'mws-eu.amazonservices.com', id: 'A1PA6795UKMFR9' },
  ES: { name: 'Spain', sc: 'ES', endpoint: 'mws-eu.amazonservices.com', id: 'A1RKKUPIHCS9HS' },
  FR: { name: 'France', sc: 'FR', endpoint: 'mws-eu.amazonservices.com', id: 'A13V1IB3VIYZZH' },
  GB: { name: 'UK', sc: 'GB', endpoint: 'mws-eu.amazonservices.com', id: 'A1F83G8C2ARO7P' },
  IT: { name: 'Italy', sc: 'IT', endpoint: 'mws-eu.amazonservices.com', id: 'APJ6JRA9NG5V4' }
}

// marketplaces returning AccessDenied errors:
// CA: { name: 'Canada', sc: 'CA', endpoint: 'mws.amazonservices.ca', id: 'A2EUQ1WTGCTBG2' }
// MX: { name: 'Mexico', sc: 'MX', endpoint: 'mws.amazonservices.com.mx', id: 'A1AM78C64UM0Y8' }
// US: { name: 'US', sc: 'US', endpoint: 'mws.amazonservices.com', id: 'ATVPDKIKX0DER' }
// AU: { name: 'Australia', sc: 'AU', endpoint: 'mws.amazonservices.com.au', id: 'A39IBJ37TRP1C6' }
// JP: { name: 'Japan', sc: 'JP', endpoint: 'mws.amazonservices.jp', id: 'A1VC38T7YXB528' }

// marketplaces returning "merchant not registered":
// AE: { name: 'United Arab Emirates (U.A.E.)', sc: 'AE', endpoint: 'mws.amazonservices.ae', id: 'A2VIGQ35RCS4UG' }
// IN: { name: 'India', sc: 'IN', endpoint: 'mws.amazonservices.in', id: 'A21TJRUUN4KGV' }
// TR: { name: 'Turkey', sc: 'TR', endpoint: 'mws-eu.amazonservices.com', id: 'A33AVAJ2PDY3EV' }

// marketplaces timing out:
// CN: { name: 'China', sc: 'CN', endpoint: 'mws.amazonservices.com.cn', id: 'AAHKV2X7AFYLW' }