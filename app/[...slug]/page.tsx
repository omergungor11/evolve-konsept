import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readReference, routes, routeByPath } from "@/lib/reference";
import { ReferenceContent } from "@/components/content/ReferenceContent";
import { HomePage } from "@/components/content/HomePage";
import { SiteInteractions } from "@/components/site/SiteInteractions";

type Props = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return routes.filter(route => route.route !== "/" && route.route !== "/llms.txt").map(route => ({ slug: route.route.slice(1).split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pathname = "/" + (await params).slug.join("/");
  return { title: routeByPath.get(pathname)?.title ?? "WeEvolveIT" };
}

export default async function Page({ params }: Props) {
  const pathname = "/" + (await params).slug.join("/");
  if (pathname === "/es") return <HomePage pathname={pathname} />;
  const content = await readReference(pathname);
  if (!content) notFound();
  return <><SiteInteractions locale={content.locale} /><ReferenceContent nodes={content.body} locale={content.locale} pathname={pathname} /></>;
}
