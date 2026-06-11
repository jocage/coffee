import { notFound } from "next/navigation";
import { CollectionView } from "@/components/social/collection-view";
import { getCollectionById } from "@/lib/data/queries";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await getCollectionById(id);

  if (!collection) {
    notFound();
  }

  return <CollectionView collection={collection} ownerView />;
}
