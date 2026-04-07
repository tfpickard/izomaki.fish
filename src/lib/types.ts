export interface NeighborCreature {
  creatureId: string;
  frames: { id: string; ascii: string; weights: unknown }[];
  experience: unknown;
  createdAt: string;
}
