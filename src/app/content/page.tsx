"use client";

import ActivityBar from "@/components/activitybar/page";
import InfinityCanvas from "@/components/interface/infinitycanvas";
import Toolbar from "@/components/toolbar/page";

const ContentPage = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Toolbar />
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <ActivityBar />
                <main className="flex min-h-0 flex-1">
                    <InfinityCanvas />
                </main>
            </div>
        </div>
    );
};

export default ContentPage;