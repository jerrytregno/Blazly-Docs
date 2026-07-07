import type { DocBlock } from "@/content/docs/types";

export function DocsContentRenderer({ blocks }: { blocks: DocBlock[] }) {
  return (
    <article className="docs-prose max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={block.text.toLowerCase().replace(/\s+/g, "-")}
                className="mb-3 mt-10 scroll-mt-24 text-xl font-semibold text-slate-900 first:mt-0 dark:text-slate-100"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="mb-2 mt-6 text-base font-semibold text-slate-800 dark:text-slate-200"
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="mb-4 leading-7 text-slate-600 dark:text-slate-400">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="mb-4 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400">
                {block.items.map((item, j) => (
                  <li key={j} className="leading-7">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mb-4 list-decimal space-y-2 pl-6 text-slate-600 dark:text-slate-400">
                {block.items.map((item, j) => (
                  <li key={j} className="leading-7">
                    {item}
                  </li>
                ))}
              </ol>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}
