import Link from "next/link";
import React from "react";

export function CourseItem({ name, id, Highlight }: { name: string, id: number, Highlight: boolean }) {
	return (
		<Link href={`/c/${id}`}>
			<div className={`flex items-center gap-2 px-4 py-1.5 text-sm text-gray-800 hover:bg-mms-indigoLight rounded-xl ${Highlight ? 'bg-mms-indigoLight' : ''}`}>
				<span className="text-mms-black rounded-full size-5 items-center flex justify-center font-semibold bg-mms-indigo">{name[0]}</span>
				<span className="truncate" title={name}>{name}</span>
			</div>
		</Link>
	);
}