export type ShapeKind = 
  | 'circle'
  | 'square'
  | 'star'
  | 'triangle'
  | 'semi-circle'
  | 'compound';

export type ColorType = 'raw' | 'red' | 'blue' | 'yellow' | 'green' | 'purple';

export interface ShapeData {
  id: string;
  kind: ShapeKind;
  color: ColorType;
  subParts?: { kind: ShapeKind; color: ColorType }[];
  tier: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type MachineType =
  | 'EMPTY'
  | 'BELT'
  | 'CUTTER'
  | 'DYE_VAT_RED'
  | 'DYE_VAT_BLUE'
  | 'DYE_VAT_YELLOW'
  | 'DYE_VAT_GREEN'
  | 'DYE_VAT_PURPLE'
  | 'OVERCLOCKER'
  | 'EXPANDER'
  | 'MERGER'
  | 'SPLITTER'
  | 'STACKER'
  | 'EMITTER_CIRCLE'
  | 'EMITTER_SQUARE'
  | 'EMITTER_STAR'
  | 'EMITTER_TRIANGLE'
  | 'HOPPER';

export interface GridCell {
  machine: MachineType;
  direction: Direction;
  progress: number;
  heldShape: ShapeData | null;
  heldShape2?: ShapeData | null;
  tickCooldown: number;
}

export interface InventoryItem {
  type: MachineType;
  count: number;
  name: string;
  category: 'NODE' | 'BELT' | 'PROCESSOR' | 'HOPPER';
  description: string;
  cost?: number;
}

export type GameMode = 'STANDARD' | 'HARD' | 'ENDLESS';

export type GameState =
  | 'TITLE'
  | 'DUNGEON'
  | 'ASSEMBLY'
  | 'MELTDOWN'
  | 'PAUSED'
  | 'SECTOR_TRANSITION'
  | 'VICTORY'
  | 'GAME_OVER';

export type RoomType =
  | 'START'
  | 'COMBAT'
  | 'WORKSHOP'
  | 'CORE_OVERSEER'
  | 'ESCAPE_POD';

export interface Door {
  direction: Direction;
  targetRoomIndex: number;
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MachTier = 0 | 1 | 2 | 3;

export interface ScrapPerks {
  magnetShrapnel: boolean;
  conveyorTurbo: boolean;
  reactivePlating: boolean;
  sentryBuddy: boolean;
  superSlide: boolean;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  baseSpeed: number;
  scrap: number;
  overdriveTimer: number;
  perks: ScrapPerks;
}

export interface MeltdownRank {
  rank: 'P' | 'S' | 'A' | 'B' | 'C';
  escapeTime: number;
  maxCombo: number;
  barricadesSmashed: number;
  isLap2: boolean;
  title: string;
  bonusReward: InventoryItem;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'HEALTH' | 'COMPONENT';
  componentType?: MachineType;
  amount: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isPurchased: boolean;
}

export interface FloorConveyor {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  speed: number;
}
