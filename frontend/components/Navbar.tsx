import { usePathname } from "next/dist/client/components/navigation";
import React from "react";

export default function Navbar() {
    const pathname = usePathname();
    return (
        <div className="w-full">
            <nav className="bg-white opacity-60 h-12 gap-4 border-b-2 border-mms-grayLight flex text-sm items-center px-6">
                <p>Dashboard</p>
                <p>{pathname}</p>
            </nav>
        </div>
    )
}