// types/flashlist.d.ts
import { FlashListProps } from "@shopify/flash-list";

declare module "@shopify/flash-list" {
  export interface FlashListProps<ItemT> {
    estimatedItemSize?: number;
  }
}
