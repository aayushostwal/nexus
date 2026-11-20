import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34, 211, 238, 0.2), 0 0 30px rgba(79, 70, 229, 0.35)",
        neon: "0 0 40px rgba(34, 211, 238, 0.25)"
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "nexus-gradient": "radial-gradient(circle at top right, rgba(34,211,238,0.22), transparent 45%), radial-gradient(circle at 20% 20%, rgba(167,139,250,0.25), transparent 40%), linear-gradient(180deg, #09090b 0%, #020617 100%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.8s ease-in-out infinite",
        marquee: "marquee 25s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
