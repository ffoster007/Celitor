import Link from "next/link";

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-black text-white font-mono">
			<nav className="fixed top-0 w-full bg-black border-b-2 border-white z-50 px-6 py-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-2">
						<img src="/assets/Calitors.png" alt="Celitor logo" className="w-8 h-8" />
						<span className="text-xl font-bold tracking-wider">CELITOR</span>
					</div>
					<div className="flex items-center gap-8">
						<Link href="/" className="hover:text-gray-300 transition-colors uppercase text-sm tracking-wide">
							Home
						</Link>
						<Link
							href="/auth/pricing"
							className="bg-white text-black px-6 py-2 font-bold hover:bg-gray-200 transition-colors uppercase tracking-wide cursor-pointer"
						>
							Get Started
						</Link>
					</div>
				</div>
			</nav>

			<main className="pt-28 pb-20 px-6">
				<div className="max-w-6xl mx-auto">
					<section className="text-center mb-16">
						<p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">Pricing</p>
						<p className="text-white/70 max-w-2xl mx-auto">
							Get started with CELITOR instantly — repo management, bookmark albums, and team sharing to help your team understand codebases faster.
						</p>
					</section>

					<section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
						<div className="border-2 border-white bg-black/70 p-8 md:p-10">
							<div className="flex items-baseline gap-4 mb-4">
								<span className="text-5xl font-bold">$2.99</span>
								<span className="text-white/60">/ month</span>
							</div>
							<p className="text-white/70 mb-8">
								Ideal for developers and small teams who want to understand codebases faster and organize knowledge effectively.
							</p>
							<div className="grid gap-4 mb-10">
								<div className="flex items-start gap-3">
									<span className="text-white">✓</span>
									<div>
										<p className="font-semibold">Unlimited Bookmark Albums</p>
										<p className="text-white/60 text-sm">Collect files and notes organized by project or team.</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<span className="text-white">✓</span>
									<div>
										<p className="font-semibold">Share Insights with Your Team</p>
										<p className="text-white/60 text-sm">Share album links for fast reviews and onboarding.</p>
									</div>
								</div>
							</div>
							<div className="flex flex-col sm:flex-row gap-4">
								<Link
									href="/auth/pricing"
									className="bg-white text-black px-8 py-3 font-bold hover:bg-gray-200 transition-all uppercase tracking-wide text-center"
								>
									Get Started
								</Link>
								<Link
									href="/content/usage-guide"
									className="border-2 border-white text-white px-8 py-3 font-bold hover:bg-white hover:text-black transition-all uppercase tracking-wide text-center"
								>
									View Usage Guide
								</Link>
							</div>
						</div>

						<aside className="border-2 border-white/60 bg-black/50 p-8">
							<h2 className="text-2xl font-bold mb-6 uppercase">All Benefits Included</h2>
							<ul className="space-y-4 text-white/70 text-sm">
								<li className="flex justify-between gap-6">
									<span>Connected repositories</span>
									<span className="font-semibold text-white">Unlimited</span>
								</li>
								<li className="flex justify-between gap-6">
									<span>Albums / bookmarks</span>
									<span className="font-semibold text-white">Unlimited</span>
								</li>
								<li className="flex justify-between gap-6">
									<span>Team sharing</span>
									<span className="font-semibold text-white">Included</span>
								</li>
								<li className="flex justify-between gap-6">
									<span>Data sync</span>
									<span className="font-semibold text-white">Realtime</span>
								</li>
								<li className="flex justify-between gap-6">
									<span>New feature updates</span>
									<span className="font-semibold text-white">Free</span>
								</li>
							</ul>
							<div className="border-t border-white/20 my-6"></div>
						</aside>
					</section>

					<section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								title: "Quick Setup",
								desc: "Connect GitHub and start exploring your codebase in minutes.",
							},
							{
								title: "Organize Your Team",
								desc: "Create albums for reviews, onboarding, and architecture summaries.",
							},
							{
								title: "Faster Onboarding",
								desc: "Help new teammates understand the project with clear structure and file paths.",
							},
						].map((item) => (
							<div key={item.title} className="border-2 border-white/50 p-6 bg-black/40">
								<h3 className="text-xl font-bold mb-2 uppercase">{item.title}</h3>
								<p className="text-white/70 text-sm">{item.desc}</p>
							</div>
						))}
					</section>
				</div>
			</main>
		</div>
	);
}
