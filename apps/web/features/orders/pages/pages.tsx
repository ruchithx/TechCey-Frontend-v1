import { FeaturePlaceholder } from "@/components/feature-placeholder";

export function OrderListPage() {
  return <FeaturePlaceholder feature="Order History" route="/orders" owner="Orders" />;
}
export function OrderDetailPage() {
  return <FeaturePlaceholder feature="Order Detail" route="/orders/:id" owner="Orders" />;
}
