import Link from "next/link";
import { attributesToProps, domToReact, Element, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import type { AnchorHTMLAttributes } from "react";
import { Suspense } from "react";
import { localAsset, type Locale } from "@/lib/reference";
import { Globe } from "@/components/home/Globe";
import { SearchView } from "@/components/site/SearchView";
import { DiagnosisJourney } from "@/components/diagnosis/DiagnosisJourney";
import { ContactJourney } from "@/components/diagnosis/ContactJourney";
import { FooterMotion } from "@/components/site/FooterMotion";
import { DotField } from "@/components/site/DotField";
import { LogoFusionMotion } from "@/components/site/LogoFusion";
import { PageMotion } from "@/components/site/PageMotion";

type ContentOptions = { locale: Locale; pathname: string; home?: boolean };

/** Converts archived editorial content into React nodes under our App Router.
 * Interactive elements are replaced by owned components; no archived JS runs.
 */
export function ReferenceContent({ nodes, ...context }: ContentOptions & { nodes: DOMNode[] }) {
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!("attribs" in node)) return;
      if (["script", "template", "noscript"].includes(node.name)) return <></>;
      if (node.name === "div" && "hidden" in node.attribs) return <></>;
      if (node.attribs.class === "pointer-events-none fixed inset-0 z-[-2]") return <DotField />;
      if (node.name === "main" && /\/search$/.test(context.pathname)) return <Suspense fallback={<main id="main-content" className="min-h-screen" aria-busy="true" />}><SearchView locale={context.locale} /></Suspense>;
      if (node.attribs["data-section"] === "2") return <DiagnosisJourney locale={context.locale} />;
      if (/\/contact$/.test(context.pathname) && node.name === "div" && node.attribs.class === "relative isolate") return <ContactJourney locale={context.locale} />;
      if (node.attribs["data-footer-section"] && !node.attribs["data-react-footer"]) {
        node.attribs["data-react-footer"] = "true";
        return <FooterMotion>{domToReact([node], options)}</FooterMotion>;
      }
      // This is the exact server-side placeholder for the original particle world.
      if (context.home && node.attribs.class === "relative h-[100svh] w-full") return <Globe />;
      for (const attribute of ["src", "href", "poster"]) {
        if (node.attribs[attribute]) node.attribs[attribute] = localAsset(node.attribs[attribute]);
      }
      if (node.attribs.srcset) {
        node.attribs.srcset = node.attribs.srcset.split(", ").map(candidate => {
          const [url, width] = candidate.split(" ");
          return `${localAsset(url)} ${width}`;
        }).join(", ");
      }
      // Each image now points at the mirrored source rather than a foreign Next optimizer.
      delete node.attribs["data-nimg"];
      if (node.name === "a" && node.attribs.href?.startsWith("/") && !node.attribs.href.startsWith("//")) {
        const props = attributesToProps(node.attribs) as AnchorHTMLAttributes<HTMLAnchorElement>;
        return <Link {...props} href={node.attribs.href} prefetch={false}>{domToReact(node.children as DOMNode[], options)}</Link>;
      }
    },
  };
  return <>{domToReact(nodes, options)}<LogoFusionMotion /><PageMotion /></>;
}
