import { BRAND_LOGO_SRC } from "@/components/brand/logo";

export function PlatformIcon({ platform }: { platform: string }) {
  const cls = "h-6 w-6 shrink-0 rounded";

  switch (platform) {
    case "chatgpt":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#10a37f" />
          <path
            fill="white"
            d="M12 6.5c-2.2 0-3.5 1.2-3.5 2.8 0 1.2.7 1.8 1.9 2.5l.9.5c.7.4 1.1.7 1.1 1.3 0 .7-.6 1.1-1.4 1.1-.9 0-1.5-.4-2-1l-1.5 1c.7 1 1.8 1.6 3.4 1.6 2.1 0 3.6-1.2 3.6-3 0-1.3-.8-2-2-2.6l-1-.5c-.8-.4-1.1-.8-1.1-1.3 0-.6.5-1 1.2-1 .7 0 1.2.3 1.6.8l1.4-.9c-.6-.9-1.6-1.4-3.1-1.4z"
          />
        </svg>
      );
    case "google":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case "gemini":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4285f4" />
              <stop offset="50%" stopColor="#9b72cb" />
              <stop offset="100%" stopColor="#d96570" />
            </linearGradient>
          </defs>
          <path fill="url(#gemini-grad)" d="M12 2l2.2 7.2L21 11l-6.8 1.8L12 20l-2.2-7.2L3 11l6.8-1.8L12 2z" />
        </svg>
      );
    case "maps":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path fill="#ea4335" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
      );
    default:
      return (
        <img
          src={BRAND_LOGO_SRC}
          alt=""
          aria-hidden
          className={`${cls} object-contain p-0.5`}
        />
      );
  }
}
