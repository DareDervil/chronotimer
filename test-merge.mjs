import { twMerge } from 'tailwind-merge';

// Test case: does !h-[75vh] beat data-[side=bottom]:h-auto?
const baseClasses = "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm";

const overrideClasses = "!h-[75vh] p-0 gap-0";

const merged = twMerge(baseClasses, overrideClasses);

console.log("Base has data-[side=bottom]:h-auto:", baseClasses.includes("data-[side=bottom]:h-auto"));
console.log("Override has !h-[75vh]:", overrideClasses.includes("!h-[75vh]"));
console.log("\nMerged result includes:");
console.log("  - !h-[75vh]:", merged.includes("!h-[75vh]"));
console.log("  - data-[side=bottom]:h-auto:", merged.includes("data-[side=bottom]:h-auto"));
console.log("  - h-auto (non-variant):", merged.includes("h-auto") && !merged.includes("data-[side=bottom]:h-auto"));
console.log("\nFull merged classes:");
console.log(merged);
