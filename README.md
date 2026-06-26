# LineupAI

Turn a short phone clip into a broadcast-style football starting lineup intro video. Built for the FIFA World Cup 2026 trend. Outputs vertical 9:16 MP4 for Instagram Reels, TikTok, and WhatsApp Status.

## Quick start

```bash
cp .env.example .env          # fill in any keys you have
npm install                   # installs all workspaces
npm run dev:backend           # http://localhost:3001
npm run dev:frontend          # http://localhost:5173
npm run dev:remotion          # http://localhost:3000 (Remotion Studio)
```

Open http://localhost:5173 to use the app end-to-end.

---

## External accounts & environment variables

| Variable | Service | Sign up | Status |
|---|---|---|---|
| `BG_REMOVAL_PROVIDER` | Background removal | — | **STUBBED** — set to `mock`; no key needed |
| `RUNWAY_API_KEY` | [Runway ML](https://runwayml.com) | runway.com | Plug in when ready |
| `UNSCREEN_API_KEY` | [Unscreen](https://unscreen.com) | unscreen.com | Alternative to Runway |
| `PAYMENT_PROVIDER` | Payments | — | **STUBBED** — set to `stub`; no key needed |
| `PAYFAST_MERCHANT_ID` | [PayFast](https://www.payfast.co.za) | payfast.co.za | SA-primary payment gateway |
| `PAYFAST_MERCHANT_KEY` | PayFast | — | From PayFast dashboard |
| `PAYFAST_PASSPHRASE` | PayFast | — | From PayFast dashboard |
| `STRIPE_SECRET_KEY` | [Stripe](https://stripe.com) | stripe.com | Alternative to PayFast |
| `STRIPE_WEBHOOK_SECRET` | Stripe | — | From Stripe dashboard |
| `S3_BUCKET` / `S3_ACCESS_KEY_ID` / etc | AWS S3 or Cloudflare R2 | aws.amazon.com / cloudflare.com | Set `STORAGE_PROVIDER=s3` or `r2` |
| `REDIS_URL` | Redis (for BullMQ) | upstash.com recommended | Set `QUEUE_PROVIDER=bullmq` |

---

## What's stubbed (v1)

| Feature | Location | What to do |
|---|---|---|
| Background removal | `backend/src/services/backgroundRemoval.ts` | Implement `runwayService` or `unscreenService`, swap export |
| Payments / tier check | `backend/src/services/payment.ts` | Implement `payfastService` or `stripeService`, swap export |
| Storage | `backend/src/services/storage.ts` | Implement `s3StorageService`, swap export |
| Job queue | `backend/src/services/queue.ts` | Implement `bullmqQueue`, swap export |
| Lambda render | `backend/src/services/renderer.ts` | Replace `execSync` with Lambda/Modal invocation |

---

## Architecture

```
frontend (React/Vite)   →   backend (Express)   →   remotion (render)
                                    ↓
                            services/
                              backgroundRemoval   (mock → Runway/Unscreen)
                              storage             (local → S3/R2)
                              queue               (memory → BullMQ)
                              payment             (stub → PayFast/Stripe)
                              renderer            (local → Lambda/Modal)
```

### Data model

A render job always has a `players[]` array. v1 sends exactly one player; team mode adds more. The Remotion composition maps over all players and renders each in sequence.

`aspectRatio` is a first-class parameter (default `"9:16"`). Landscape output (`"16:9"`) can be enabled without structural changes.

---

## Tiers

| Tier | Price | Watermark | Resolution |
|---|---|---|---|
| Free | R0 | Yes | 480p |
| Individual | R49/month | No | 1080p |

Tier is set at job-creation time and baked into the render props — the Remotion composition trusts the `watermark` and `resolution` props it receives.

---

## Roadmap

- [ ] Real background removal (Runway / Unscreen)
- [ ] PayFast payment integration
- [ ] User accounts + monthly quota enforcement
- [ ] S3/R2 storage
- [ ] AWS Lambda / Modal.com rendering
- [ ] Team mode (N players + formation reveal scene)
- [ ] Landscape (16:9) output
