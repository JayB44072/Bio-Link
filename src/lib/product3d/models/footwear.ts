import type { Label, ModelDef } from '../types';
import { DEFAULT_SPEC, buildFootwear, footwearGroups, type Closure, type FootwearColors, type FootwearSpec } from './footwearBuilder';

const L = (fr: string, en: string): Label => ({ fr, en });

/** Noms des pièces selon la fermeture. */
const CLOSURE_LABEL: Record<Closure, Label> = {
  laces: L('Lacets et languette', 'Laces and tongue'),
  velcro: L('Scratchs', 'Velcro straps'),
  buckle: L('Boucle', 'Buckle'),
  zip: L('Fermeture éclair', 'Zip'),
  elastic: L('Élastiques latéraux', 'Elastic gussets'),
  bow: L('Nœud', 'Bow'),
  tassel: L('Pampilles', 'Tassels'),
  strap: L('Sangle', 'Strap'),
  none: L('Fermeture', 'Closure'),
};

/** Palettes réutilisées. */
const C = {
  whiteViolet: { upper: '#f1f1f6', accent: '#6C63FF', outsole: '#3a3a48', midsole: '#ffffff', insole: '#c9c9d6', lace: '#6C63FF', lining: '#d3d3df' },
  whiteNavy:   { upper: '#f4f4f8', accent: '#1f2a52', outsole: '#cfcfda', midsole: '#ffffff', insole: '#c9c9d6', lace: '#1f2a52', lining: '#d9dbe8' },
  blackRed:    { upper: '#24242c', accent: '#e23b4e', outsole: '#9a9aa8', midsole: '#f0f0f4', insole: '#4a4a56', lace: '#f0f0f4', lining: '#3a3a46' },
  sandCoral:   { upper: '#e6d9c3', accent: '#ff7a59', outsole: '#bfae90', midsole: '#f6efe2', insole: '#d8cdb8', lace: '#ff7a59', lining: '#d9ccb4' },
  greyLime:    { upper: '#9fa6b8', accent: '#b6e03a', outsole: '#2a2a34', midsole: '#e8eaf0', insole: '#5a5f70', lace: '#e8eaf0', lining: '#707688' },
  tan:         { upper: '#b9824a', accent: '#6b4220', outsole: '#3a2a1c', midsole: '#8a5a30', insole: '#d9b98c', lace: '#6b4220', lining: '#8a5a30' },
  brown:       { upper: '#6b3f22', accent: '#3d2412', outsole: '#241810', midsole: '#4a2c18', insole: '#caa070', lace: '#241810', lining: '#4a2c18' },
  black:       { upper: '#1c1c22', accent: '#0e0e12', outsole: '#0e0e12', midsole: '#26262e', insole: '#5a5a66', lace: '#0e0e12', lining: '#2c2c34' },
  burgundy:    { upper: '#6a1a2a', accent: '#3a0c16', outsole: '#1c0a0e', midsole: '#4a1220', insole: '#caa070', lace: '#3a0c16', lining: '#4a1220' },
  olive:       { upper: '#6b7048', accent: '#c8b37a', outsole: '#1e2014', midsole: '#4a4e30', insole: '#b5ad8a', lace: '#c8b37a', lining: '#4a4e30' },
  yellow:      { upper: '#f3c317', accent: '#1c1c22', outsole: '#1c1c22', midsole: '#d6a90f', insole: '#f0e6b0', lace: '#1c1c22', lining: '#d6a90f' },
  blush:       { upper: '#f2b8c6', accent: '#d94f7a', outsole: '#d94f7a', midsole: '#f7d4dd', insole: '#fbe3ea', lace: '#d94f7a', lining: '#e9a0b3' },
  red:         { upper: '#cc2b3c', accent: '#7a1420', outsole: '#1c0a0e', midsole: '#9c1c2c', insole: '#e8a0a8', lace: '#7a1420', lining: '#9c1c2c' },
  navy:        { upper: '#1f2f5c', accent: '#d9b25a', outsole: '#0e1428', midsole: '#16224a', insole: '#7a86a8', lace: '#d9b25a', lining: '#16224a' },
  sky:         { upper: '#7fc4ff', accent: '#ffffff', outsole: '#2a4a70', midsole: '#e8f4ff', insole: '#cfe6fa', lace: '#ffffff', lining: '#5aa6e8' },
  gold:        { upper: '#d8b25a', accent: '#8a6a22', outsole: '#3a2a10', midsole: '#a8873a', insole: '#f0dca0', lace: '#8a6a22', lining: '#a8873a' },
  rope:        { upper: '#2a2a50', accent: '#d9b98c', outsole: '#d9b98c', midsole: '#cfae78', insole: '#e6d4ae', lace: '#d9b98c', lining: '#cfae78' },
  neonGreen:   { upper: '#ffffff', accent: '#1fd18a', outsole: '#1c1c22', midsole: '#e8e8ee', insole: '#9fe8cc', lace: '#1fd18a', lining: '#d9d9e2' },
  mint:        { upper: '#c9efe0', accent: '#2fb88a', outsole: '#2a5a4a', midsole: '#f2fbf7', insole: '#d9f4ea', lace: '#2fb88a', lining: '#a8dfc9' },
} satisfies Record<string, FootwearColors>;

interface Def {
  id: string;
  fr: string;
  en: string;
  keywords: string[];
  spec: Partial<Omit<FootwearSpec, 'colors'>>;
  colors: FootwearColors;
  /** Noms de pièces particuliers. */
  labels?: Partial<Record<'outsole' | 'midsole' | 'insole' | 'upper' | 'closure' | 'details', Label>>;
}

const DEFS: Def[] = [
  { id: 'sneaker', fr: 'Basket basse', en: 'Low sneaker', keywords: ['basket', 'sneaker', 'baskets', 'sneakers', 'tennis'], spec: { details: ['panel'] }, colors: C.whiteViolet },
  { id: 'retro-sneaker', fr: 'Basket rétro', en: 'Retro sneaker', keywords: ['retro', 'vintage', 'old school'], spec: { details: ['panel', 'bandline', 'stitch'], height: 0.95 }, colors: C.sandCoral },
  { id: 'runner', fr: 'Chaussure de running', en: 'Running shoe', keywords: ['running', 'course', 'jogging', 'runner', 'marathon'], spec: { sole: 1.55, details: ['heelcounter', 'tab', 'panel'], height: 0.95 }, colors: C.greyLime, labels: { midsole: L('Semelle amortissante', 'Cushioned midsole') } },
  { id: 'high-top', fr: 'Basket montante', en: 'High-top sneaker', keywords: ['montante', 'high top', 'hightop', 'converse', 'high-top'], spec: { height: 1.4, details: ['toecap', 'tab'] }, colors: C.blackRed },
  { id: 'basketball', fr: 'Chaussure de basket-ball', en: 'Basketball shoe', keywords: ['basketball', 'basket-ball', 'jordan'], spec: { height: 1.45, sole: 1.4, details: ['panel', 'heelcounter', 'tab'] }, colors: C.blackRed, labels: { midsole: L('Semelle amortissante', 'Cushioned midsole') } },
  { id: 'skate', fr: 'Chaussure de skate', en: 'Skate shoe', keywords: ['skate', 'skateboard', 'vans'], spec: { sole: 1.25, height: 1.05, details: ['toecap', 'stitch', 'bandline'] }, colors: C.whiteNavy },
  { id: 'chunky', fr: 'Basket chunky', en: 'Chunky sneaker', keywords: ['chunky', 'dad shoe', 'epaisse', 'massive'], spec: { sole: 2.1, details: ['panel', 'heelcounter'], width: 1.1 }, colors: C.whiteViolet },
  { id: 'slip-on', fr: 'Slip-on', en: 'Slip-on', keywords: ['slip-on', 'slip on', 'sans lacets', 'enfiler'], spec: { closure: 'elastic', vampStart: 0.5, collarGap: 0.6, height: 0.85, details: ['bandline'] }, colors: C.sky },
  { id: 'platform-sneaker', fr: 'Basket à plateforme', en: 'Platform sneaker', keywords: ['plateforme', 'platform', 'compensee sport'], spec: { heel: 'platform', details: ['panel', 'toecap'], height: 1.05 }, colors: C.blush },
  { id: 'trail', fr: 'Chaussure de trail', en: 'Trail shoe', keywords: ['trail', 'montagne', 'terrain'], spec: { sole: 1.6, height: 1.05, details: ['lugs', 'toecap', 'heelcounter'] }, colors: C.olive },
  { id: 'hiking-boot', fr: 'Chaussure de randonnée', en: 'Hiking boot', keywords: ['randonnee', 'hiking', 'trekking', 'rando'], spec: { height: 1.55, sole: 1.7, collarGap: 0.4, details: ['lugs', 'toecap', 'heelcounter'] }, colors: C.tan },
  { id: 'work-boot', fr: 'Botte de chantier', en: 'Work boot', keywords: ['chantier', 'securite', 'work boot', 'travail'], spec: { height: 1.5, sole: 1.5, collarGap: 0.4, details: ['toecap', 'stitch', 'lugs'] }, colors: C.yellow },
  { id: 'chelsea', fr: 'Chelsea boot', en: 'Chelsea boot', keywords: ['chelsea'], spec: { height: 1.45, closure: 'elastic', vampStart: 0.5, collarGap: 0.55, details: ['tab', 'stitch'] }, colors: C.brown },
  { id: 'ankle-boot', fr: 'Bottine', en: 'Ankle boot', keywords: ['bottine', 'bottines', 'ankle boot'], spec: { height: 1.4, closure: 'zip', vampStart: 0.5, collarGap: 0.5, details: ['stitch'] }, colors: C.black },
  { id: 'combat-boot', fr: 'Rangers', en: 'Combat boot', keywords: ['rangers', 'combat', 'militaire', 'army'], spec: { height: 1.6, sole: 1.5, details: ['toecap', 'lugs'], collarGap: 0.4 }, colors: C.black },
  { id: 'cowboy-boot', fr: 'Botte de cowboy', en: 'Cowboy boot', keywords: ['cowboy', 'western', 'santiags'], spec: { height: 1.95, toe: 'point', closure: 'none', heel: 'block', heelH: 0.34, vampStart: 0.45, collarGap: 0.55, details: ['stitch', 'bandline'] }, colors: C.burgundy, labels: { midsole: L('Talon', 'Heel') } },
  { id: 'rain-boot', fr: 'Botte de pluie', en: 'Rain boot', keywords: ['pluie', 'rain', 'wellington', 'caoutchouc'], spec: { height: 1.85, closure: 'none', vampStart: 0.45, collarGap: 0.6, sole: 1.1, details: ['bandline'] }, colors: C.yellow },
  { id: 'snow-boot', fr: 'Boots fourrées', en: 'Snow boot', keywords: ['neige', 'snow', 'fourrure', 'hiver', 'winter'], spec: { height: 1.55, sole: 1.5, details: ['fur', 'lugs'], collarGap: 0.45 }, colors: C.sandCoral },
  { id: 'loafer', fr: 'Mocassin', en: 'Loafer', keywords: ['mocassin', 'loafer', 'moccasin'], spec: { height: 0.72, closure: 'strap', vampStart: 0.5, collarGap: 0.65, sole: 0.8, details: ['stitch'] }, colors: C.brown },
  { id: 'tassel-loafer', fr: 'Mocassin à pampilles', en: 'Tassel loafer', keywords: ['pampilles', 'tassel'], spec: { height: 0.72, closure: 'tassel', vampStart: 0.5, collarGap: 0.65, sole: 0.8, details: ['stitch'] }, colors: C.burgundy },
  { id: 'derby', fr: 'Derby', en: 'Derby shoe', keywords: ['derby'], spec: { height: 0.9, vampStart: 0.62, sole: 0.85, details: ['brogue', 'stitch'] }, colors: C.tan },
  { id: 'oxford', fr: 'Richelieu', en: 'Oxford shoe', keywords: ['richelieu', 'oxford', 'ville', 'classique', 'costume'], spec: { height: 0.85, toe: 'point', vampStart: 0.6, sole: 0.8, details: ['toecap'] }, colors: C.black },
  { id: 'monk-strap', fr: 'Chaussure à boucle', en: 'Monk strap', keywords: ['boucle', 'monk', 'monkstrap'], spec: { height: 0.9, closure: 'buckle', vampStart: 0.55, sole: 0.85, details: ['stitch'] }, colors: C.navy },
  { id: 'ballerina', fr: 'Ballerine', en: 'Ballet flat', keywords: ['ballerine', 'ballerines', 'ballet'], spec: { height: 0.42, closure: 'bow', vampStart: 0.38, collarGap: 0.85, sole: 0.45, details: [] }, colors: C.blush },
  { id: 'pump', fr: 'Escarpin', en: 'Pump', keywords: ['escarpin', 'escarpins', 'pump', 'talon aiguille', 'stiletto'], spec: { height: 0.62, toe: 'point', closure: 'none', heel: 'stiletto', heelH: 1.0, vampStart: 0.4, collarGap: 0.78, sole: 0.4, details: ['stitch'] }, colors: C.red, labels: { midsole: L('Talon aiguille', 'Stiletto heel') } },
  { id: 'block-heel', fr: 'Chaussure à talon bloc', en: 'Block-heel shoe', keywords: ['talon bloc', 'block heel', 'talon carre'], spec: { height: 0.7, toe: 'square', closure: 'strap', heel: 'block', heelH: 0.62, vampStart: 0.45, collarGap: 0.7, sole: 0.5, details: ['stitch'] }, colors: C.gold, labels: { midsole: L('Talon bloc', 'Block heel') } },
  { id: 'wedge', fr: 'Sandale compensée', en: 'Wedge sandal', keywords: ['compensee', 'compensees', 'wedge', 'espadrille compensee'], spec: { upper: 'straps', heel: 'wedge', heelH: 0.95, sole: 0.4 }, colors: C.rope, labels: { midsole: L('Semelle compensée', 'Wedge sole'), closure: L('Sangle de cheville', 'Ankle strap') } },
  { id: 'sandal', fr: 'Sandale à brides', en: 'Strappy sandal', keywords: ['sandale', 'sandales', 'sandal', 'brides'], spec: { upper: 'straps', sole: 0.55 }, colors: C.tan, labels: { upper: L('Brides', 'Straps'), closure: L('Sangle de cheville', 'Ankle strap') } },
  { id: 'slide', fr: 'Claquette', en: 'Slide', keywords: ['claquette', 'claquettes', 'slide', 'slides', 'piscine'], spec: { upper: 'slide', sole: 0.7 }, colors: C.mint, labels: { upper: L('Bride', 'Band'), closure: L('Détail', 'Detail') } },
  { id: 'flip-flop', fr: 'Tong', en: 'Flip-flop', keywords: ['tong', 'tongs', 'flip flop', 'flip-flop', 'plage'], spec: { upper: 'thong', sole: 0.7 }, colors: C.neonGreen, labels: { upper: L('Entre-doigt', 'Thong strap'), closure: L('Détail', 'Detail') } },
  { id: 'clog', fr: 'Sabot', en: 'Clog', keywords: ['sabot', 'sabots', 'clog', 'clogs'], spec: { upper: 'clog', sole: 1.3, height: 0.8 }, colors: C.tan, labels: { closure: L('Sangle arrière', 'Heel strap') } },
  { id: 'football-boot', fr: 'Chaussure de football', en: 'Football boot', keywords: ['football', 'foot', 'crampons', 'cleats', 'soccer'], spec: { height: 0.95, sole: 0.7, details: ['cleats', 'heelcounter', 'panel'] }, colors: C.neonGreen, labels: { details: L('Crampons', 'Studs') } },
];

function toModel(d: Def): ModelDef {
  const base: FootwearSpec = { ...DEFAULT_SPEC, ...d.spec, colors: d.colors };
  const groups = footwearGroups(base);
  const dict: Record<string, Label> = {
    outsole: d.labels?.outsole ?? L('Semelle extérieure', 'Outsole'),
    midsole: d.labels?.midsole ?? (base.heel === 'platform' ? L('Plateforme', 'Platform sole') : L('Semelle intermédiaire', 'Midsole')),
    insole: d.labels?.insole ?? L('Semelle de confort', 'Insole'),
    upper: d.labels?.upper ?? L('Tige', 'Upper'),
    closure: d.labels?.closure ?? CLOSURE_LABEL[base.closure],
    details: d.labels?.details ?? L('Détails', 'Details'),
  };
  const parts: Record<string, Label> = {};
  groups.forEach(g => { parts[g] = dict[g]; });
  return {
    id: d.id,
    category: 'footwear',
    name: L(d.fr, d.en),
    parts,
    keywords: d.keywords,
    build: accent => buildFootwear({ ...base, colors: accent ? { ...base.colors, accent, lace: base.closure === 'laces' ? accent : base.colors.lace } : base.colors }),
  };
}

export const FOOTWEAR_MODELS: ModelDef[] = DEFS.map(toModel);
