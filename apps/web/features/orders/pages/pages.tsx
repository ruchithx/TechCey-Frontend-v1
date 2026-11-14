import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { OrderListPage as OrderList } from "../components/orders-page";

export function OrderListPage() {
  return <OrderList />;
}
export function OrderDetailPage() {
  return <FeaturePlaceholder feature="Order Detail" route="/orders/:id" owner="Orders" />;
}
