"use client";

const LINKS = [
  {
    group: "CPU",
    items: [
      {
        label: "IBM — Central Processing Unit",
        url: "https://www.ibm.com/think/topics/central-processing-unit",
      },
      {
        label: "IBM — Cache memory",
        url: "https://www.ibm.com/think/topics/cache-memory",
      },
    ],
  },
  {
    group: "Digital Logic",
    items: [
      {
        label: "IBM — Logic gates",
        url: "https://www.ibm.com/think/topics/logic-gate",
      },
    ],
  },
  {
    group: "GPU / Parallel",
    items: [
      {
        label: "NVIDIA — CUDA Zone",
        url: "https://developer.nvidia.com/cuda-zone",
      },
    ],
  },
];

export function SourcesView() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          Sources & Credits
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Overclocked was created as an educational project for{" "}
          <span className="text-foreground">CSC 3501: Computer Organization and Design</span>.
          Course lectures supply the topic basis; explanations here are rewritten in original
          language and are not copies of slide text.
        </p>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Further Reading
        </h3>
        <p className="mt-1 text-[11px] text-muted">
          External links for deeper study. Not an endorsement.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {LINKS.map((group) => (
            <li key={group.group}>
              <p className="font-mono text-xs font-semibold text-foreground">{group.group}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent-text underline-offset-2 hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
