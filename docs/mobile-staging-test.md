# MotoHub Mobile Staging Test

## Local Phone Test

1. Make sure the computer and phone use the same Wi-Fi network.
2. Find the computer IP:

```powershell
ipconfig
```

Use the IPv4 address, for example `192.168.2.98`.

3. Start Vite:

```bash
npm run dev -- --host 0.0.0.0
```

4. Open on the phone:

```text
http://<LOCAL_IP>:5173
```

`localhost` on the phone means the phone itself, not the computer.

## Supabase Auth URLs

In Supabase Dashboard add redirect URLs for local testing:

```text
http://localhost:5173
http://localhost:5173/auth/callback
http://<LOCAL_IP>:5173
http://<LOCAL_IP>:5173/auth/callback
```

Later add the staging domain:

```text
https://staging.<domain>
https://staging.<domain>/auth/callback
```

## Yandex Maps Referer

For local phone testing add the local IP referer in Yandex Maps API settings:

```text
http://<LOCAL_IP>:5173/*
```

Keep production keys restricted to exact staging/production domains. Do not use `*` for production.

## HTTPS Staging

When the staging domain is ready, check:

- direct opening of `/map`, `/profile`, `/moderation`, `/admin/content`, `/admin/users`, `/admin/audit`;
- PWA install prompt;
- service worker update;
- Yandex Maps loading on HTTPS.
