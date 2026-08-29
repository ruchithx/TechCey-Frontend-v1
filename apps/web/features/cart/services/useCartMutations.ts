import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  multiplyMoney,
  queryKeys,
  request,
  sumMoney,
  toMoney,
  type CartResponse,
  type CartItemResponse,
} from "@/core/api";

function recomputeTotalPrice(items: CartItemResponse[]) {
  return items.length > 0 ? sumMoney(...items.map((i) => i.lineTotal)) : toMoney("0.00");
}

/**
 * Optimistic add/update/remove/clear against the cached CartResponse, with
 * rollback on failure (README: "latency is user-visible"). Each mutation
 * snapshots the previous cart, applies the change locally, and restores the
 * snapshot if the request fails — then always refetches to reconcile with the
 * server (e.g. after a 409 insufficient-stock rejection).
 */
function useOptimisticCartMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<CartResponse>,
  applyOptimistic: (cart: CartResponse | undefined, vars: TVars) => CartResponse | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all });
      const previous = queryClient.getQueryData<CartResponse>(queryKeys.cart.all);
      queryClient.setQueryData<CartResponse | undefined>(queryKeys.cart.all, (current) =>
        applyOptimistic(current, vars),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cart.all, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}

export function useAddCartItem() {
  return useOptimisticCartMutation<{ productId: number; quantity: number; unitPrice?: string; productName?: string }>(
    ({ productId, quantity }) =>
      request<CartResponse>(ENDPOINTS.cart.addItem(), { method: "POST", body: { productId, quantity } }),
    (cart, { productId, quantity, unitPrice, productName }) => {
      if (!cart) return cart;
      const existing = cart.items.find((i) => i.productId === productId);
      let items: CartItemResponse[];
      if (existing) {
        const nextQuantity = existing.quantity + quantity;
        items = cart.items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: nextQuantity, lineTotal: multiplyMoney(i.unitPrice, nextQuantity) }
            : i,
        );
      } else {
        if (!unitPrice || !productName) return cart; // can't synthesise a new line without product data
        const price = toMoney(unitPrice);
        items = [
          ...cart.items,
          { productId, productName, unitPrice: price, quantity, lineTotal: multiplyMoney(price, quantity) },
        ];
      }
      return { ...cart, items, totalQuantity: cart.totalQuantity + quantity, totalPrice: recomputeTotalPrice(items) };
    },
  );
}

export function useUpdateCartItem() {
  return useOptimisticCartMutation<{ productId: number; quantity: number }>(
    ({ productId, quantity }) =>
      request<CartResponse>(ENDPOINTS.cart.updateItem(productId), { method: "PUT", body: { quantity } }),
    (cart, { productId, quantity }) => {
      if (!cart) return cart;
      let deltaQuantity = 0;
      const items = cart.items.map((i) => {
        if (i.productId !== productId) return i;
        deltaQuantity = quantity - i.quantity;
        return { ...i, quantity, lineTotal: multiplyMoney(i.unitPrice, quantity) };
      });
      return {
        ...cart,
        items,
        totalQuantity: cart.totalQuantity + deltaQuantity,
        totalPrice: recomputeTotalPrice(items),
      };
    },
  );
}

export function useRemoveCartItem() {
  return useOptimisticCartMutation<{ productId: number }>(
    ({ productId }) => request<CartResponse>(ENDPOINTS.cart.removeItem(productId), { method: "DELETE" }),
    (cart, { productId }) => {
      if (!cart) return cart;
      const removed = cart.items.find((i) => i.productId === productId);
      const items = cart.items.filter((i) => i.productId !== productId);
      return {
        ...cart,
        items,
        totalQuantity: cart.totalQuantity - (removed?.quantity ?? 0),
        totalPrice: recomputeTotalPrice(items),
      };
    },
  );
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<void>(ENDPOINTS.cart.clear(), { method: "DELETE" }),
    onSuccess: () => {
      queryClient.setQueryData<CartResponse | undefined>(queryKeys.cart.all, (current) =>
        current ? { ...current, items: [], totalQuantity: 0, totalPrice: toMoney("0.00") } : current,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}
