import type { LandingLang } from '../../../lib/landingTranslations';
import type { PartKey } from './buildShoe';

interface PartCopy { title: string; text: string }
interface ShoeCopy {
  brand: string;
  tagline: string;
  parts: Record<PartKey, PartCopy>;
}

/** Textes de la présentation de la chaussure, par langue. */
export const SHOE_COPY: Record<LandingLang, ShoeCopy> = {
  fr: {
    brand: 'BioLinkWD',
    tagline: 'Chaque produit mérite sa page.',
    parts: {
      outsole: { title: 'Semelle extérieure',    text: 'Gomme antidérapante pour une adhérence durable.' },
      midsole: { title: 'Semelle intermédiaire', text: 'Un amorti léger qui absorbe chaque pas.' },
      insole:  { title: 'Semelle de confort',    text: 'Elle épouse le pied et garde la fraîcheur.' },
      upper:   { title: 'Tige',                  text: 'Matière respirante, coupe ajustée.' },
      tongue:  { title: 'Languette',             text: 'Rembourrée pour protéger le cou-de-pied.' },
      laces:   { title: 'Lacets',                text: 'Un serrage précis, une tenue toute la journée.' },
      caps:    { title: 'Renforts',              text: 'Embout et contrefort pour une solidité maximale.' },
    },
  },
  en: {
    brand: 'BioLinkWD',
    tagline: 'Every product deserves its page.',
    parts: {
      outsole: { title: 'Outsole',        text: 'Non-slip rubber for lasting grip.' },
      midsole: { title: 'Midsole',        text: 'Light cushioning that absorbs every step.' },
      insole:  { title: 'Insole',         text: 'It follows the foot and keeps it fresh.' },
      upper:   { title: 'Upper',          text: 'Breathable material with a snug fit.' },
      tongue:  { title: 'Tongue',         text: 'Padded to protect the top of the foot.' },
      laces:   { title: 'Laces',          text: 'Precise tightening, all-day hold.' },
      caps:    { title: 'Reinforcements', text: 'Toe cap and heel counter for maximum durability.' },
    },
  },
  pt: {
    brand: 'BioLinkWD',
    tagline: 'Cada produto merece a sua página.',
    parts: {
      outsole: { title: 'Sola exterior', text: 'Borracha antiderrapante para uma aderência duradoura.' },
      midsole: { title: 'Entressola',    text: 'Amortecimento leve que absorve cada passo.' },
      insole:  { title: 'Palmilha',      text: 'Ajusta-se ao pé e mantém a frescura.' },
      upper:   { title: 'Gáspea',        text: 'Material respirável, corte ajustado.' },
      tongue:  { title: 'Lingueta',      text: 'Acolchoada para proteger o peito do pé.' },
      laces:   { title: 'Atacadores',    text: 'Aperto preciso, firmeza o dia todo.' },
      caps:    { title: 'Reforços',      text: 'Biqueira e contraforte para máxima resistência.' },
    },
  },
  de: {
    brand: 'BioLinkWD',
    tagline: 'Jedes Produkt verdient seine Seite.',
    parts: {
      outsole: { title: 'Laufsohle',     text: 'Rutschfester Gummi für dauerhaften Halt.' },
      midsole: { title: 'Zwischensohle', text: 'Leichte Dämpfung, die jeden Schritt abfedert.' },
      insole:  { title: 'Einlegesohle',  text: 'Sie passt sich dem Fuß an und bleibt frisch.' },
      upper:   { title: 'Schaft',        text: 'Atmungsaktives Material, anliegender Schnitt.' },
      tongue:  { title: 'Zunge',         text: 'Gepolstert zum Schutz des Fußrückens.' },
      laces:   { title: 'Schnürsenkel',  text: 'Präzises Schnüren, Halt den ganzen Tag.' },
      caps:    { title: 'Verstärkungen', text: 'Kappe und Fersenkappe für maximale Haltbarkeit.' },
    },
  },
};
