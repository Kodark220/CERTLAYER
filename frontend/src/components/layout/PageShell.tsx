import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PageShell({ children }: Props) {
  return <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">{children}</main>;
}

