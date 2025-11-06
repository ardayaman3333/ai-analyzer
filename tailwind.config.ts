// Tailwind CSS v4 - Minimal config
// Most configuration is now done in CSS using @theme directive
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', 
  ],
}

export default config
