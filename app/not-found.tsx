import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", padding: "10vw" }}><h1>Page not found</h1><p>The address is not part of this website.</p><Link href="/">Back to home</Link></main>;
}
