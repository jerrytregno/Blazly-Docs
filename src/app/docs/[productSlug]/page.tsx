import { redirect, notFound } from "next/navigation";
import {
  DOCS_NAV,
  articlePath,
  defaultArticleForProduct,
  getProductNav,
} from "@/config/docs-navigation";

interface PageProps {
  params: Promise<{ productSlug: string }>;
}

export function generateStaticParams() {
  return DOCS_NAV.map((product) => ({ productSlug: product.slug }));
}

export default async function ProductDocsPage({ params }: PageProps) {
  const { productSlug } = await params;
  const product = getProductNav(productSlug);
  if (!product) notFound();

  const first = defaultArticleForProduct(productSlug);
  if (!first) notFound();

  redirect(articlePath(productSlug, first.slug));
}
