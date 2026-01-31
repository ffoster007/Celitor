"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Toolbar from "@/components/toolbar/page";

type SubscriptionPayload = {
	active: boolean;
	subscription: {
		id: string;
		stripePriceId: string;
		status: string;
		currentPeriodEnd: string | null;
		cancelAtPeriodEnd?: boolean;
	} | null;
};

const formatDate = (value: string | null) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleDateString("en-GB", {
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
};

const SettingsPage = () => {
	const { status } = useSession();
	const [loading, setLoading] = useState(true);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [payload, setPayload] = useState<SubscriptionPayload | null>(null);

	const refreshSubscription = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/stripe/subscription", {
				method: "GET",
				cache: "no-store",
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.error || "Failed to load subscription");
			}
			const data = (await response.json()) as SubscriptionPayload;
			setPayload(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load subscription");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (status === "authenticated") {
			refreshSubscription();
		} else if (status === "unauthenticated") {
			setLoading(false);
		}
	}, [status, refreshSubscription]);

	const handleCancel = useCallback(async () => {
		if (cancelLoading) return;
		setCancelLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/stripe/subscription", {
				method: "POST",
				cache: "no-store",
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.error || "Failed to cancel subscription");
			}
			await refreshSubscription();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel subscription");
		} finally {
			setCancelLoading(false);
		}
	}, [cancelLoading, refreshSubscription]);

	const handleDeleteAccount = useCallback(async () => {
		if (deleteLoading) return;
		const confirmed = window.confirm(
			"Delete your account? This will permanently remove your data and cannot be undone."
		);
		if (!confirmed) return;
		setDeleteLoading(true);
		setDeleteError(null);
		try {
			const response = await fetch("/api/account", {
				method: "DELETE",
				cache: "no-store",
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.error || "Failed to delete account");
			}
			await signOut({ callbackUrl: "/open/oauth" });
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
		} finally {
			setDeleteLoading(false);
		}
	}, [deleteLoading]);

	const subscription = payload?.subscription ?? null;
	const isActive = payload?.active ?? false;
	const cancelAtPeriodEnd = Boolean(subscription?.cancelAtPeriodEnd);
	const statusLabel = useMemo(() => {
		if (!subscription) return "No active subscription";
		if (cancelAtPeriodEnd) return "Cancel scheduled";
		return subscription.status;
	}, [subscription, cancelAtPeriodEnd]);

	return (
		<div className="min-h-screen bg-black text-white">
			<Toolbar />
			<div className="mx-auto w-full max-w-3xl px-6 py-12">
				<div className="mb-6">
					<h1 className="text-2xl font-semibold">Settings</h1>
					<p className="mt-1 text-sm text-slate-400">Manage your subscription status.</p>
				</div>

				<div className="rounded-lg border border-slate-800 bg-black/70 p-6">
					{status === "loading" || loading ? (
						<div className="flex items-center gap-2 text-sm text-slate-300">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>Loading subscription...</span>
						</div>
					) : status === "unauthenticated" ? (
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm text-amber-200">
								<AlertTriangle className="h-4 w-4" />
								<span>Please sign in to manage your subscription.</span>
							</div>
							<Link
								href="/open/oauth"
								className="inline-flex items-center rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-600 hover:text-white"
							>
								Go to sign in
							</Link>
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-4 py-3">
								<div>
									<div className="text-sm text-slate-400">Status</div>
									<div className="text-base font-medium text-white">{statusLabel}</div>
								</div>
								<div className="text-right">
									<div className="text-xs text-slate-400">Renews until</div>
									<div className="text-sm text-slate-200">
										{formatDate(subscription?.currentPeriodEnd ?? null)}
									</div>
								</div>
							</div>

							{error ? (
								<div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
									<AlertTriangle className="h-4 w-4" />
									<span>{error}</span>
								</div>
							) : null}

							{isActive ? (
								<div className="space-y-3">
									<p className="text-sm text-slate-400">
										Canceling will keep your access until the end of the current billing period.
									</p>
									<button
										onClick={handleCancel}
										disabled={cancelLoading || cancelAtPeriodEnd}
										className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-400/60 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
									>
										{cancelLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<AlertTriangle className="h-4 w-4" />
										)}
										<span>{cancelAtPeriodEnd ? "Cancellation scheduled" : "Cancel subscription"}</span>
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
									<CheckCircle2 className="h-4 w-4" />
									<span>No active subscription to cancel.</span>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="mt-6 rounded-lg border border-slate-800 bg-black/70 p-6">
					<div className="mb-4">
						<h2 className="text-lg font-semibold">Account</h2>
						<p className="mt-1 text-sm text-slate-400">
							Manage your account and personal data.
						</p>
					</div>

					{status === "authenticated" ? (
						<div className="space-y-3">
							<p className="text-sm text-slate-400">
								Deleting your account permanently removes your albums, notes, and
								subscription history.
							</p>
							{deleteError ? (
								<div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
									<AlertTriangle className="h-4 w-4" />
									<span>{deleteError}</span>
								</div>
							) : null}
							<button
								onClick={handleDeleteAccount}
								disabled={deleteLoading}
								className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-400/60 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
							>
								{deleteLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<AlertTriangle className="h-4 w-4" />
								)}
								<span>Delete Account</span>
							</button>
						</div>
					) : (
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm text-amber-200">
								<AlertTriangle className="h-4 w-4" />
								<span>Please sign in to manage your account.</span>
							</div>
							<Link
								href="/open/oauth"
								className="inline-flex items-center rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-600 hover:text-white"
							>
								Go to sign in
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;
