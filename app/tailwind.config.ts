import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "warden-navy": "#0B0D1A",
        "warden-surface": "#111327",
        "warden-border": "#1E2140",
        "warden-cyan": "#00E5CC",
        "warden-orange": "#FF9B26",
        "warden-coral": "#EE4F27",
        "warden-purple": "#6C5CE7",
        "warden-steel": "#2A2D45",
        "hud-green": "#39FF14",
        "hud-blue": "#00D4FF",
        "alert-red": "#FF0033",
        "terminal-green": "#33FF33",
        "neon-pink": "#FF2D78",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "warden-gradient": "linear-gradient(135deg, #00E5CC 0%, #FF9B26 100%)",
        "warden-gradient-r": "linear-gradient(135deg, #FF9B26 0%, #00E5CC 100%)",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 229, 204, 0.15)",
        "glow-orange": "0 0 20px rgba(255, 155, 38, 0.15)",
        "glow-purple": "0 0 20px rgba(108, 92, 231, 0.15)",
        "glow-cyan-lg": "0 0 40px rgba(0, 229, 204, 0.2)",
        "glow-coral": "0 0 20px rgba(238, 79, 39, 0.15)",
        "neon-cyan": "0 0 10px rgba(0, 229, 204, 0.4), 0 0 40px rgba(0, 229, 204, 0.15), 0 0 80px rgba(0, 229, 204, 0.05)",
        "neon-green": "0 0 10px rgba(57, 255, 20, 0.4), 0 0 40px rgba(57, 255, 20, 0.15)",
        "neon-orange": "0 0 10px rgba(255, 155, 38, 0.4), 0 0 40px rgba(255, 155, 38, 0.15)",
        "neon-red": "0 0 10px rgba(255, 0, 51, 0.4), 0 0 40px rgba(255, 0, 51, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "slide-up-delay-1": "slideUp 0.6s ease-out 0.1s forwards",
        "slide-up-delay-2": "slideUp 0.6s ease-out 0.2s forwards",
        "slide-up-delay-3": "slideUp 0.6s ease-out 0.3s forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "bounce-slow": "bounce 2s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease-in-out infinite",
        glitch: "glitch 0.3s ease-in-out",
        scanline: "scanlineMove 4s linear infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
        "hud-flicker": "hudFlicker 4s ease-in-out infinite",
        "border-scan": "borderScan 3s linear infinite",
        typewriter: "typewriter 2s steps(30) forwards",
        "cursor-blink": "cursorBlink 1s step-end infinite",
        "radar-sweep": "radarSweep 3s linear infinite",
        "data-stream": "dataStream 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 229, 204, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 229, 204, 0.25)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        scanlineMove: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        neonPulse: {
          "0%, 100%": { opacity: "0.6", textShadow: "0 0 4px currentColor" },
          "50%": { opacity: "1", textShadow: "0 0 12px currentColor, 0 0 24px currentColor" },
        },
        hudFlicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.8" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.9" },
          "97%": { opacity: "1" },
        },
        borderScan: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        cursorBlink: {
          "0%, 100%": { borderColor: "transparent" },
          "50%": { borderColor: "#00E5CC" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        dataStream: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        hud: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
