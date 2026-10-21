import Link from "next/link";
import { CallUs } from "@/components/ui/CallUs";
export default function NotFound() {
  return <div className="container-x py-24 text-center"><h1 className="text-4xl font-bold">That page has moved</h1><p className="text-ink-2 mt-2">Try the search above, or start from a category.</p><Link href="/products" className="btn btn-primary mt-6">Browse products</Link><div className="mt-4"><CallUs /></div></div>;
}
