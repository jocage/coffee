import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/social/collection-view";
import { getPublicCollection } from "@/lib/data/queries";

type Params = { handle: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle, slug } = await params;
  const collection = await getPublicCollection(handle, slug);

  if (!collection) {
    return { title: "Collection not found" };
  }

  return {
    title: `${collection.title} by ${collection.owner.displayName}`,
    description: collection.description
  };
}

export default async function PublicCollectionPage({ params }: { params: Promise<Params> }) {
  const { handle, slug } = await params;
  const collection = await getPublicCollection(handle, slug);

  if (!collection) {
    notFound();
  }

  return <CollectionView collection={collection} />;
}
