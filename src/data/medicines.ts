export type IngredientId = 'ibu' | 'par';
export type ProductForm = 'syrup' | 'suppository' | 'tablet';

export type Ingredient = {
  id: IngredientId;
  name: string;
  mgPerKg: number;
  maxPerDay: number;
  hoursBetweenDoses: number;
  /** Název druhé účinné látky v 7. pádě ("střídat s …"). */
  alternateWith: string;
};

export type Brand = {
  id: string;
  name: string;
};

export type Product = {
  id: number;
  brand: string;
  name: string;
  ingredient: IngredientId;
} & (
  | { form: 'syrup'; mgPerMl: number }
  | { form: 'suppository' | 'tablet'; mgPerPiece: number }
);

export const SOURCE_NAME = 'Pediatrie Revoluční';
export const SOURCE_URL =
  'https://www.pediatrie-revolucni.cz/cs/kalkulacka-davkovani-leku-na-snizeni-teploty';

export const ingredients: Record<IngredientId, Ingredient> = {
  ibu: {
    id: 'ibu',
    name: 'Ibuprofen',
    mgPerKg: 10,
    maxPerDay: 3,
    hoursBetweenDoses: 8,
    alternateWith: 'paracetamolem',
  },
  par: {
    id: 'par',
    name: 'Paracetamol',
    mgPerKg: 15,
    maxPerDay: 4,
    hoursBetweenDoses: 6,
    alternateWith: 'ibuprofenem',
  },
};

export const brands: Brand[] = [
  { id: 'nurofen', name: 'Nurofen' },
  { id: 'panadol', name: 'Panadol' },
  { id: 'ibalgin', name: 'Ibalgin' },
  { id: 'paralen', name: 'Paralen' },
];

export const products: Product[] = [
  { id: 1, brand: 'nurofen', name: 'Sirup (jahoda/pomeranč)', form: 'syrup', ingredient: 'ibu', mgPerMl: 20 },
  { id: 2, brand: 'nurofen', name: 'Sirup Junior (6+ let)', form: 'syrup', ingredient: 'ibu', mgPerMl: 40 },
  { id: 3, brand: 'nurofen', name: 'Čípky 60 mg', form: 'suppository', ingredient: 'ibu', mgPerPiece: 60 },
  { id: 4, brand: 'nurofen', name: 'Čípky 125 mg', form: 'suppository', ingredient: 'ibu', mgPerPiece: 125 },
  { id: 5, brand: 'panadol', name: 'Baby sirup', form: 'syrup', ingredient: 'par', mgPerMl: 24 },
  { id: 6, brand: 'panadol', name: 'Čípky 125 mg', form: 'suppository', ingredient: 'par', mgPerPiece: 125 },
  { id: 7, brand: 'panadol', name: 'Čípky 250 mg', form: 'suppository', ingredient: 'par', mgPerPiece: 250 },
  { id: 8, brand: 'ibalgin', name: 'Baby sirup', form: 'syrup', ingredient: 'ibu', mgPerMl: 20 },
  { id: 9, brand: 'ibalgin', name: 'Tablety 200 mg', form: 'tablet', ingredient: 'ibu', mgPerPiece: 200 },
  { id: 10, brand: 'paralen', name: 'Čípky 100 mg', form: 'suppository', ingredient: 'par', mgPerPiece: 100 },
  { id: 11, brand: 'paralen', name: 'Tablety 125 mg', form: 'tablet', ingredient: 'par', mgPerPiece: 125 },
];
