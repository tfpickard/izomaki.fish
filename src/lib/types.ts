export interface NeighborCreature {
  creatureId: string;
  frames: { id: string; ascii: string; weights: unknown }[];
  experience: unknown;
  createdAt: string;
}

export interface UserProfile {
  handle: string | null;
  bio: string | null;
  links: {
    website?: string;
    mastodon?: string;
    github?: string;
  };
}

export interface LandingCreatureData {
  creatureId: string;
  attractorType: string;
  frames: { id: string; ascii: string; weights: unknown }[];
}

export interface PlatformStats {
  totalCreatures: number;
  totalFrames: number;
  activeCreatures: number;
  oldestCreatureAge: number;
  avgFramesPerCreature: number;
}
