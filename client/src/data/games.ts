import type { CategorySlug } from '../lib/types'

export interface GameInfo {
  name: string
  description: string
  players: string
  chips?: boolean
}

export interface Category {
  slug: CategorySlug
  name: string
  tagline: string
  accent: string
  games: GameInfo[]
}

export const CATEGORIES: Category[] = [
  {
    slug: 'carte',
    name: 'Carte',
    tagline: 'I classici senza tempo: mazzi, punti e sfide all’ultima presa.',
    accent: 'var(--accent)',
    games: [
      {
        name: 'Blackjack',
        description: 'Batti il banco arrivando a 21 senza sballare. Puntate in fiches, adrenalina garantita.',
        players: '2-6 giocatori',
        chips: true,
      },
      {
        name: 'Poker',
        description: "Texas Hold'em: due carte, cinque comuni e la faccia di chi bluffa meglio.",
        players: '2-8 giocatori',
        chips: true,
      },
      {
        name: 'Scala 40',
        description: 'Sequenze e tris per scartare per primi. Occhio alle matte.',
        players: '2-6 giocatori',
      },
      {
        name: 'Briscola',
        description: 'La regina dei giochi di carte italiani, a coppie o tutti contro tutti.',
        players: '2-4 giocatori',
      },
      {
        name: 'Tresette',
        description: 'Il gioco di presa più elegante: sette, ordine e mariagi.',
        players: '2-4 giocatori',
      },
      {
        name: 'Cuori',
        description: 'Evita la dama di picche e i cuori: chi prende, perde punti.',
        players: '3-6 giocatori',
      },
      {
        name: 'Guerra',
        description: 'Il classico senza pensieri: si gira e chi ha la carta più alta vince.',
        players: '2-4 giocatori',
      },
      {
        name: 'Memory',
        description: 'Ritrova le coppie nascoste e sfida l’attenzione degli amici.',
        players: '2-4 giocatori',
      },
      {
        name: 'Sette e mezzo',
        description: 'Re, cavallo e fante valgono mezzo: decidi quando fermarti senza sballare.',
        players: '2-6 giocatori',
        chips: true,
      },
    ],
  },
  {
    slug: '3d',
    name: '3D',
    tagline: 'Prove di mira, velocità e fisica in scenari tridimensionali.',
    accent: 'var(--accent-2)',
    games: [
      {
        name: 'Mini Golf 3D',
        description: 'Percorsi colorati, angoli impossibili e un colpo da campioni.',
        players: '1-4 giocatori',
      },
      {
        name: 'Tiro al bersaglio',
        description: 'Mira, tieni conto del vento e centra il centro del bersaglio.',
        players: '1-4 giocatori',
      },
      {
        name: 'Domino 3D',
        description: 'Crea file di mattonelle e falle crollare nel modo più spettacolare.',
        players: '2-4 giocatori',
      },
      {
        name: 'Labirinto 3D',
        description: 'Trova l’uscita prima degli altri: ogni svolta nasconde una sorpresa.',
        players: '2-4 giocatori',
      },
      {
        name: 'Palla prigioniera',
        description: 'Schiva, lancia e colpisci: l’ultima squadra in piedi vince.',
        players: '4-8 giocatori',
      },
      {
        name: 'Biliardo',
        description: 'Tacchetti, sponde e traiettorie: lo scontro si decide sul panno verde.',
        players: '2-2 giocatori',
      },
    ],
  },
  {
    slug: 'tavolo',
    name: 'Da tavolo',
    tagline: 'Sfide strategiche uno contro uno, sul tavolo di casa.',
    accent: 'var(--ok)',
    games: [
      {
        name: 'Dama',
        description: 'Cattura, promuovi a dama e domina la scacchiera mossa dopo mossa.',
        players: '2-2 giocatori',
      },
      {
        name: 'Scacchi',
        description: 'La sfida per eccellenza: strategia, tattica e sangue freddo.',
        players: '2-2 giocatori',
      },
      {
        name: 'Tris',
        description: 'Tre in fila per vincere: semplice nel regolamento, crudele negli esiti.',
        players: '2-2 giocatori',
      },
      {
        name: 'Forza 4',
        description: 'Lascia cadere le pedine e allinea quattro gettoni prima dell’altro.',
        players: '2-2 giocatori',
      },
      {
        name: 'Battaglia navale',
        description: 'Colpisci le flotte avversarie... e attento a dove piazzi le tue.',
        players: '2-2 giocatori',
      },
      {
        name: 'Indovina chi',
        description: 'Fai domande, elimina sospetti e indovina il personaggio segreto.',
        players: '2-2 giocatori',
      },
    ],
  },
  {
    slug: 'party',
    name: 'Party',
    tagline: 'Risate garantite: parole, gesti e domande per accendere la serata.',
    accent: 'var(--warn)',
    games: [
      {
        name: 'Tabù',
        description: 'Descrivi la parola senza dire quella proibita. Batteria a cronometro.',
        players: '4-8 giocatori',
      },
      {
        name: 'Sciarade',
        description: 'Mima, disegna o racconta: il team indovina e il tempo scorre.',
        players: '4-8 giocatori',
      },
      {
        name: 'Quiz serale',
        description: 'Domande di cultura, musica e pop: chi ne sa di più stasera?',
        players: '3-8 giocatori',
      },
      {
        name: 'Telefono senza fili',
        description: 'Passa il messaggio di frase in frase, poi confronta gli strafalcioni.',
        players: '4-8 giocatori',
      },
      {
        name: 'Disegna e indovina',
        description: 'Un pennarello, un indovinello e molto umorismo involontario.',
        players: '3-8 giocatori',
      },
      {
        name: '20 domande',
        description: 'Solo venti indizi per capire a cosa stai pensando. Vincono i più furbi.',
        players: '3-6 giocatori',
      },
    ],
  },
]

export const TOTAL_GAMES = CATEGORIES.reduce((total, category) => total + category.games.length, 0)

export function findCategory(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug)
}