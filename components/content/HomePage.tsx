import { notFound } from "next/navigation";
import { readReference } from "@/lib/reference";
import { ReferenceContent } from "./ReferenceContent";
import { HomeMotion } from "@/components/home/HomeMotion";
import { SiteInteractions } from "@/components/site/SiteInteractions";

export async function HomePage({ pathname = "/" }: { pathname?: string }) {
  const content = await readReference(pathname);
  if (!content) notFound();
  return <HomeMotion><SiteInteractions locale={content.locale} /><ReferenceContent nodes={content.body} locale={content.locale} pathname={pathname} home /></HomeMotion>;
}
