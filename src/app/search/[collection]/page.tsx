import { permanentRedirect } from "next/navigation";

export default function DeprecatedSearchCollectionPage({
  params,
}: {
  params: { collection: string };
}) {
  permanentRedirect(`/collections/${params.collection}`);
}
