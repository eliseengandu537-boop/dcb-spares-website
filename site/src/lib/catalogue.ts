import productData from "@/data/products.json";
import catalogueData from "@/data/catalogue.json";
import originalAliases from "@/data/product-aliases.json";

export type Product = {
  id: number; slug: string; name: string; code: string; source: string;
  categories: string[]; brands: string[]; thumbnail: string | null; images: string[];
  specifications: { label: string; value: string }[]; description: string[];
};
export type ProductSummary = Pick<Product, "id" | "slug" | "name" | "code" | "categories" | "brands" | "thumbnail"> & { search: string };
export const products: Product[] = productData;
export const catalogue = catalogueData;
export const productBySlug = new Map(products.map(product => [product.slug, product]));
export const productAliases: {slug:string;id:number}[] = originalAliases;
for(const alias of productAliases){const product=products.find(p=>p.id===alias.id);if(product)productBySlug.set(alias.slug,product);}
export const productSummaries: ProductSummary[] = products.map(({id,slug,name,code,categories,brands,thumbnail,specifications}) => ({
  id,slug,name,code,categories,brands,thumbnail,
  search: `${name} ${code} ${specifications.map(s => s.value).join(" ")}`.toLowerCase(),
}));
const brandNames: Record<string,string> = {mitsubishi:"Mitsubishi",ford:"Ford",mazda:"Mazda",volvo:"Volvo","mercedes-benz":"Mercedes-Benz",toyota:"Toyota",citroen:"Citroën",peugeot:"Peugeot","john-deere":"John Deere",case:"Case",cummins:"Cummins",volkswagen:"Volkswagen"};
export const vehicleBrands = catalogue.brands.map(brand => ({...brand,name:brandNames[brand.slug] ?? brand.name}));
