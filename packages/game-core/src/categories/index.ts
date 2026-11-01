import { DISHES, DRINKS, FRUITS, SWEETS, VEGETABLES } from "./food";
import { ANIMALS, FLOWERS } from "./nature";
import { NAMES, JOBS } from "./people";
import { CITIES, COUNTRIES } from "./places";
import { BODY, CLOTHES, COLORS, INSTRUMENTS, OBJECTS, SPORTS } from "./things";
import type { Category } from "./types";

export type { Category } from "./types";

/** Ordem do painel do streamer. */
export const CATEGORIES: readonly Category[] = [
  FRUITS,
  ANIMALS,
  NAMES,
  COUNTRIES,
  JOBS,
  SWEETS,
  DISHES,
  DRINKS,
  OBJECTS,
  BODY,
  COLORS,
  CITIES,
  VEGETABLES,
  FLOWERS,
  SPORTS,
  INSTRUMENTS,
  CLOTHES,
];

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export const getCategory = (id: string): Category | undefined => BY_ID.get(id);
