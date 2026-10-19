import { Card, Link } from "@heroui/react";
import type { SourcesFile } from "../types";

export function SourcesPanel({ sources }: { sources: SourcesFile }) {
  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-lg">
        Miejsca i organizatorzy, u których warto sprawdzać kolejne terminy. Datowane wydarzenia są w
        zakładce Wydarzenia.
      </p>
      {sources.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-3xl">{section.title}</h2>
            <p className="mt-1 text-sm text-muted">{section.intro}</p>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {section.items.map((item) => (
              <li key={item.name}>
                <Card className="soft-card h-full">
                  <Card.Header>
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Description>{item.detail}</Card.Description>
                  </Card.Header>
                  <Card.Footer className="flex flex-wrap gap-x-4 gap-y-2">
                    {item.links.map((link) => (
                      <Link key={link.url} href={link.url} rel="noopener noreferrer" target="_blank">
                        {link.label}
                        <Link.Icon />
                      </Link>
                    ))}
                  </Card.Footer>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
