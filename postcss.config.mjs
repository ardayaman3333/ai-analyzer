/* postcss.config.mjs (GERÇEK DOĞRU HALİ) */

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- HATA MESAJININ İSTEDİĞİ BU!
    autoprefixer: {},
  },
};

export default config;