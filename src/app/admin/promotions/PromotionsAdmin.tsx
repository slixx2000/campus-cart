"use client";

import { useActionState } from "react";
import {
  createBannerAction,
  endBannerAction,
  endPromotionAction,
  grantPromotionAction,
  type PromotionState,
} from "./actions";

type ActivePromotion = {
  id: string;
  listing_id: string;
  listing_title: string;
  ends_at: string;
  amount_kwacha: number | null;
  note: string | null;
};

type Banner = {
  id: string;
  placement: string;
  title: string;
  advertiser: string | null;
  ends_at: string;
};

function Feedback({ state }: { state: PromotionState }) {
  if (!state.message) return null;
  return (
    <p className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`} role="status">
      {state.message}
    </p>
  );
}

export default function PromotionsAdmin({
  promotions,
  banners,
}: {
  promotions: ActivePromotion[];
  banners: Banner[];
}) {
  const [grantState, grantAction, granting] = useActionState(
    grantPromotionAction,
    {} as PromotionState
  );
  const [endState, endAction] = useActionState(endPromotionAction, {} as PromotionState);
  const [bannerState, bannerAction, creatingBanner] = useActionState(
    createBannerAction,
    {} as PromotionState
  );
  const [endBannerState, endBannerFormAction] = useActionState(
    endBannerAction,
    {} as PromotionState
  );

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-ZM");

  return (
    <div className="space-y-8">
      {/* ─── Sell featured placement ─────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-fg">Feature a listing</h2>
        <p className="mt-1 text-sm text-muted">
          Take payment over mobile money first, then grant the placement here. Granting
          again extends an existing promotion rather than stacking a second one.
        </p>

        <form action={grantAction} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-fg">Listing ID</span>
            <input name="listingId" required placeholder="uuid" className="input" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-fg">Days</span>
            <input name="days" type="number" min={1} max={365} defaultValue={7} required className="input" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-fg">Amount paid (K)</span>
            <input name="amount" type="number" min={0} step="0.01" className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-fg">Note</span>
            <input name="note" maxLength={300} placeholder="e.g. paid via Airtel Money, ref 12345" className="input" />
          </label>
          <div className="sm:col-span-2 flex items-center gap-4">
            <button type="submit" disabled={granting} className="btn-primary px-6 disabled:opacity-60">
              {granting ? "Granting…" : "Grant placement"}
            </button>
            <Feedback state={grantState} />
          </div>
        </form>
      </section>

      {/* ─── Currently featured ──────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-fg">Active placements</h2>
        <Feedback state={endState} />
        {promotions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing is currently featured.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {promotions.map((promo) => (
              <li key={promo.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{promo.listing_title}</p>
                  <p className="text-xs text-muted">
                    Until {fmt(promo.ends_at)}
                    {promo.amount_kwacha != null ? ` · K${promo.amount_kwacha}` : ""}
                    {promo.note ? ` · ${promo.note}` : ""}
                  </p>
                </div>
                <form action={endAction}>
                  <input type="hidden" name="listingId" value={promo.listing_id} />
                  <button type="submit" className="btn-secondary px-4 py-2 text-xs">
                    End now
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Banner ads ──────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-fg">Banner ads</h2>
        <p className="mt-1 text-sm text-muted">
          Rendered inside the listing grid on the chosen page.
        </p>

        <form action={bannerAction} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium text-fg">Placement</span>
            <select name="placement" className="input" defaultValue="browse">
              <option value="browse">Browse</option>
              <option value="home">Home</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-fg">Days</span>
            <input name="days" type="number" min={1} max={365} defaultValue={30} required className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-fg">Title</span>
            <input name="title" required maxLength={120} className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-fg">Image URL</span>
            <input name="imageUrl" type="url" required className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-fg">Destination URL</span>
            <input name="targetUrl" type="url" required className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-fg">Advertiser</span>
            <input name="advertiser" maxLength={120} className="input" />
          </label>
          <div className="sm:col-span-2 flex items-center gap-4">
            <button type="submit" disabled={creatingBanner} className="btn-primary px-6 disabled:opacity-60">
              {creatingBanner ? "Creating…" : "Create banner"}
            </button>
            <Feedback state={bannerState} />
          </div>
        </form>

        <Feedback state={endBannerState} />
        {banners.length > 0 ? (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {banners.map((banner) => (
              <li key={banner.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{banner.title}</p>
                  <p className="text-xs text-muted">
                    {banner.placement} · until {fmt(banner.ends_at)}
                    {banner.advertiser ? ` · ${banner.advertiser}` : ""}
                  </p>
                </div>
                <form action={endBannerFormAction}>
                  <input type="hidden" name="bannerId" value={banner.id} />
                  <button type="submit" className="btn-secondary px-4 py-2 text-xs">
                    End now
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
