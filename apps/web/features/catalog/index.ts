/** Public surface of the catalog feature. The ONLY entry point — deep imports
 * into this folder are blocked by the D5 boundary lint rules. */
export {
  HomePage,
  ProductListPage,
  ProductDetailPage,
  CategoryPage,
  SearchPage,
} from "./pages/pages";
export { catalogRoutes } from "./catalog.routes";
