import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  title: string;
  description: string;
  status?: string;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ title, description, status, actions, meta }: Props) {
  return (
    <header className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {status ? (
              <Badge variant="secondary" className="border border-border/80 bg-secondary/50 text-foreground">
                {status}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          {meta ? <div>{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

