"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { StoreUser } from "./store-provider";

type Address = {
  id?: string;
  label: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
};
const blankAddress = (name: string): Address => ({
  label: "Home",
  recipient: name,
  line1: "",
  city: "Phnom Penh",
  country: "Cambodia",
  isDefault: false,
});

export function ProfileEditor({
  user,
  liveMode,
}: {
  user: StoreUser;
  liveMode: boolean;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<Address>(blankAddress(user.name));
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const loadProfile = useCallback(async () => {
    if (!liveMode) return;
    const response = await fetch("/api/profile", { cache: "no-store" });
    const body = (await response.json()) as {
      profile?: { phone?: string; addresses?: Address[] };
      message?: string;
    };
    if (!response.ok)
      throw new Error(body.message ?? "Unable to load profile details.");
    setPhone(body.profile?.phone ?? "");
    setAddresses(body.profile?.addresses ?? []);
    if (body.profile?.addresses?.[0]) setAddress(body.profile.addresses[0]);
  }, [liveMode]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile().catch((cause) =>
        setMessage(
          cause instanceof Error
            ? cause.message
            : "Unable to load profile details.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      address: {
        ...address,
        label: form.get("label"),
        recipient: form.get("recipient"),
        line1: form.get("line1"),
        city: form.get("city"),
        country: form.get("country"),
      },
    };
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    setMessage(
      response.ok
        ? "Profile and default address saved."
        : (body.message ?? "Unable to save profile."),
    );
    if (response.ok) await loadProfile();
  };
  const addAddress = async () => {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(address),
    });
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    setMessage(
      response.ok
        ? "Address added."
        : (body.message ?? "Unable to add address."),
    );
    if (response.ok) await loadProfile();
  };
  const removeAddress = async (id?: string) => {
    if (!id) return;
    const response = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessage(response.ok ? "Address removed." : "Unable to remove address.");
    if (response.ok) {
      setAddress(blankAddress(user.name));
      await loadProfile();
    }
  };

  return (
    <div className="profile-card">
      <p className="eyebrow">Profile and saved addresses</p>
      {addresses.length > 0 && (
        <div className="address-list">
          {addresses.map((item) => (
            <div className="radio-card" key={item.id}>
              <button
                type="button"
                className="text-link"
                onClick={() => setAddress(item)}
              >
                <b>
                  {item.label}
                  {item.isDefault ? " · Default" : ""}
                </b>
                <br />
                <small>
                  {item.line1}, {item.city}, {item.country}
                </small>
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={() => void removeAddress(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>
              Full name
              <input
                name="fullName"
                defaultValue={user.name}
                disabled={!liveMode}
                required
              />
            </label>
          </div>
          <div className="field">
            <label>
              Phone
              <input
                name="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={!liveMode}
              />
            </label>
          </div>
          <div className="field">
            <label>
              Address label
              <input
                name="label"
                value={address.label}
                onChange={(event) =>
                  setAddress({ ...address, label: event.target.value })
                }
                disabled={!liveMode}
                required
              />
            </label>
          </div>
          <div className="field">
            <label>
              Recipient
              <input
                name="recipient"
                value={address.recipient}
                onChange={(event) =>
                  setAddress({ ...address, recipient: event.target.value })
                }
                disabled={!liveMode}
                required
              />
            </label>
          </div>
          <div className="field full">
            <label>
              Street address
              <input
                name="line1"
                value={address.line1}
                onChange={(event) =>
                  setAddress({ ...address, line1: event.target.value })
                }
                disabled={!liveMode}
                required
              />
            </label>
          </div>
          <div className="field">
            <label>
              City
              <input
                name="city"
                value={address.city}
                onChange={(event) =>
                  setAddress({ ...address, city: event.target.value })
                }
                disabled={!liveMode}
                required
              />
            </label>
          </div>
          <div className="field">
            <label>
              Country
              <input
                name="country"
                value={address.country}
                onChange={(event) =>
                  setAddress({ ...address, country: event.target.value })
                }
                disabled={!liveMode}
                required
              />
            </label>
          </div>
        </div>
        {liveMode ? (
          <div className="filter-actions">
            <button className="button button-primary">Save as default</button>
            {!address.id && (
              <button
                className="button button-outline"
                type="button"
                onClick={() => void addAddress()}
              >
                Add address
              </button>
            )}
            <button
              className="text-link"
              type="button"
              onClick={() => setAddress(blankAddress(user.name))}
            >
              New address
            </button>
          </div>
        ) : (
          <p className="secure-note">
            Connect Supabase to edit and persist profile details.
          </p>
        )}
        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}
