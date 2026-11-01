// Presentes do TikTok com imagem própria (public/gifts), na ordem de preço da loja.
// O nome é o que o TikTok manda no evento; `prefix` cobre nomes longos que podem vir
// diferentes no fim.

export type CatalogGift = { name: string; image: string; prefix?: string };

export const GIFTS: readonly CatalogGift[] = [
  { name: "Treasure Box", image: "/gifts/treasure-box.webp" },
  { name: "Animated Gift", image: "/gifts/animated-gift.webp" },
  { name: "Brat", image: "/gifts/brat.webp" },
  { name: "Flame heart", image: "/gifts/flame-heart.webp" },
  { name: "Football", image: "/gifts/football.webp" },
  { name: "GG", image: "/gifts/gg.webp" },
  { name: "Gimme The Vote", image: "/gifts/gimme-the-vote.webp" },
  { name: "Heart Me", image: "/gifts/heart-me.webp" },
  { name: "Heart Puff", image: "/gifts/heart-puff.webp" },
  { name: "Ice Cream Cone", image: "/gifts/ice-cream-cone.webp" },
  { name: "Music Play", image: "/gifts/music-play.webp" },
  { name: "Rainbow", image: "/gifts/rainbow.webp" },
  { name: "Rose", image: "/gifts/rose.webp" },
  { name: "TGIF", image: "/gifts/tgif.webp" },
  { name: "TikTok", image: "/gifts/tiktok.webp" },
  { name: "Aura Point", image: "/gifts/aura-point.webp" },
  { name: "Finger heart", image: "/gifts/finger-heart.webp" },
  { name: "Tofu", image: "/gifts/tofu.webp" },
  { name: "Baguette", image: "/gifts/baguette.webp" },
  { name: "Book", image: "/gifts/book.webp" },
  { name: "Dragon egg", image: "/gifts/dragon-egg.webp" },
  {
    name: "Friendship Necklace",
    image: "/gifts/friendship-necklace.webp",
    prefix: "Friendship Neckla",
  },
  { name: "Rosa", image: "/gifts/rosa.webp" },
  { name: "Tiny Diny", image: "/gifts/tiny-diny.webp" },
  { name: "Perfume", image: "/gifts/perfume.webp" },
  { name: "Doughnut", image: "/gifts/doughnut.webp" },
  {
    name: "Sign language love",
    image: "/gifts/sign-language-love.webp",
    prefix: "Sign language lov",
  },
  { name: "Family", image: "/gifts/family.webp" },
  { name: "Cap", image: "/gifts/cap.webp" },
  { name: "Little Crown", image: "/gifts/little-crown.webp" },
  { name: "Love Painting", image: "/gifts/love-painting.webp" },
  { name: "Paper Crane", image: "/gifts/paper-crane.webp" },
  { name: "Sceptre", image: "/gifts/sceptre.webp" },
  { name: "Hearts", image: "/gifts/hearts.webp" },
  { name: "Massage for You", image: "/gifts/massage-for-you.webp" },
  { name: "Meerkat", image: "/gifts/meerkat.webp" },
  { name: "Potato in Paris", image: "/gifts/potato-in-paris.webp" },
  { name: "Stinging Bee", image: "/gifts/stinging-bee.webp" },
  { name: "Boxing Gloves", image: "/gifts/boxing-gloves.webp" },
  { name: "Corgi", image: "/gifts/corgi.webp" },
  { name: "Dancing Flower", image: "/gifts/dancing-flower.webp" },
  { name: "Fruit Friends", image: "/gifts/fruit-friends.webp" },
  { name: "Naughty Chicken", image: "/gifts/naughty-chicken.webp" },
  { name: "Play for You", image: "/gifts/play-for-you.webp" },
  { name: "Victory sign", image: "/gifts/victory-sign.webp" },
  { name: "KSA", image: "/gifts/ksa.webp" },
  { name: "Forever Rosa", image: "/gifts/forever-rosa.webp" },
  { name: "Good Afternoon", image: "/gifts/good-afternoon.webp" },
  { name: "Good Morning", image: "/gifts/good-morning.webp" },
  { name: "Happy Friday", image: "/gifts/happy-friday.webp" },
  {
    name: "Jollie the Joy Bean",
    image: "/gifts/jollie-the-joy-bean.webp",
    prefix: "Jollie the Joy Be",
  },
  { name: "Magic Rhythm", image: "/gifts/magic-rhythm.webp" },
  { name: "Relaxed Goose", image: "/gifts/relaxed-goose.webp" },
  {
    name: "Rocky the Rock Bean",
    image: "/gifts/rocky-the-rock-bean.webp",
    prefix: "Rocky the Rock Be",
  },
  {
    name: "Rosie the Rose Bean",
    image: "/gifts/rosie-the-rose-bean.webp",
    prefix: "Rosie the Rose Be",
  },
  {
    name: "Sage the Smart Bean",
    image: "/gifts/sage-the-smart-bean.webp",
    prefix: "Sage the Smart Be",
  },
  { name: "Singing mic", image: "/gifts/singing-mic.webp" },
  { name: "Tom's Hug", image: "/gifts/tom-s-hug.webp" },
  { name: "Coral", image: "/gifts/coral.webp" },
  { name: "Couch Potato", image: "/gifts/couch-potato.webp" },
  { name: "Cuddle with Me", image: "/gifts/cuddle-with-me.webp" },
  { name: "DJ Glasses", image: "/gifts/dj-glasses.webp" },
  { name: "Flower Show", image: "/gifts/flower-show.webp" },
  { name: "Hena Aura", image: "/gifts/hena-aura.webp" },
  { name: "Money Gun", image: "/gifts/money-gun.webp" },
  { name: "VR Goggles", image: "/gifts/vr-goggles.webp" },
  { name: "Swan", image: "/gifts/swan.webp" },
  { name: "Lovely Music", image: "/gifts/lovely-music.webp" },
  {
    name: "Tiny Diny the astronaut",
    image: "/gifts/tiny-diny-the-astronaut.webp",
    prefix: "Tiny Diny the ast",
  },
  { name: "Galaxy", image: "/gifts/galaxy.webp" },
  { name: "French Metro", image: "/gifts/french-metro.webp" },
  { name: "Diamond crown", image: "/gifts/diamond-crown.webp" },
  { name: "EWC Trophy", image: "/gifts/ewc-trophy.webp" },
  { name: "Whale Diving", image: "/gifts/whale-diving.webp" },
  { name: "Golden Party", image: "/gifts/golden-party.webp" },
  { name: "Blob in Paris", image: "/gifts/blob-in-paris.webp" },
  { name: "Flying Jets", image: "/gifts/flying-jets.webp" },
  {
    name: "Work Hard Play Harder",
    image: "/gifts/work-hard-play-harder.webp",
    prefix: "Work Hard Play Ha",
  },
  { name: "Diamond Shield", image: "/gifts/diamond-shield.webp" },
  { name: "Paris", image: "/gifts/paris.webp" },
  { name: "Amusement Park", image: "/gifts/amusement-park.webp" },
  { name: "Dragon Flame", image: "/gifts/dragon-flame.webp" },
  { name: "Lion", image: "/gifts/lion.webp" },
  { name: "Leon and Lion", image: "/gifts/leon-and-lion.webp" },
  { name: "TikTok Universe", image: "/gifts/tiktok-universe.webp" },
];

const key = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** Acha o presente do catálogo pelo nome que veio da live (exato ou pelo começo). */
export const findGift = (name: string | undefined): CatalogGift | undefined => {
  const wanted = key(name ?? "");
  if (!wanted) return undefined;
  return (
    GIFTS.find((gift) => key(gift.name) === wanted) ??
    GIFTS.find((gift) => gift.prefix && wanted.startsWith(key(gift.prefix)))
  );
};

/** Nome do catálogo para o presente da live (ou o próprio nome, se não estiver na lista). */
export const canonicalGiftName = (name: string) => findGift(name)?.name ?? name;

/** Imagem do presente: a do catálogo; se não tiver, a que o Neon já viu na live. */
export const giftImage = (name: string, liveCatalog: Record<string, string> = {}) =>
  findGift(name)?.image ?? liveCatalog[key(name)];
