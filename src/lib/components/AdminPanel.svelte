<script lang="ts">
  import SoundEngine from './SoundEngine.svelte';
  import FrameEditor from './FrameEditor.svelte';
  import FrameLibrary from './FrameLibrary.svelte';
  import StateInspector from './StateInspector.svelte';
  import AttractorInspector from './AttractorInspector.svelte';
  import TrajectoryConfig from './TrajectoryConfig.svelte';
  import CreatureManager from './CreatureManager.svelte';

  interface CreatureData {
    id: string;
    created_at: string;
    generation_count: number;
    display_order: number;
    frames: { id: string }[];
  }

  interface Props {
    allCreatures: CreatureData[];
    maxCreatures: number;
  }

  let { allCreatures, maxCreatures }: Props = $props();

  let open = $state(false);

  type Section = 'creatures' | 'editor' | 'library' | 'state' | 'attractor' | 'trajectory';
  let collapsed = $state<Record<Section, boolean>>({
    creatures: false,
    editor: false,
    library: false,
    state: true,
    attractor: true,
    trajectory: true
  });

  function toggle(section: Section) {
    collapsed[section] = !collapsed[section];
  }
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-0">
  {#if open}
    <div class="w-96 bg-neutral-900 border-l border-neutral-800 overflow-y-auto max-h-screen pb-10 flex flex-col">
      {#each [
        { key: 'creatures'   as Section, label: 'creatures' },
        { key: 'editor'      as Section, label: 'frame editor' },
        { key: 'library'     as Section, label: 'frame library' },
        { key: 'state'       as Section, label: 'state' },
        { key: 'attractor'   as Section, label: 'attractor' },
        { key: 'trajectory'  as Section, label: 'trajectory' }
      ] as section}
        <div class="border-b border-neutral-800">
          <button
            onclick={() => toggle(section.key)}
            class="w-full text-left px-3 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-400 flex justify-between items-center"
          >
            <span>{section.label}</span>
            <span>{collapsed[section.key] ? '+' : '−'}</span>
          </button>
          {#if !collapsed[section.key]}
            <div class="px-3 pb-3">
              {#if section.key === 'creatures'}
                <CreatureManager {allCreatures} {maxCreatures} />
              {:else if section.key === 'editor'}
                <FrameEditor />
              {:else if section.key === 'library'}
                <FrameLibrary />
              {:else if section.key === 'state'}
                <StateInspector />
              {:else if section.key === 'attractor'}
                <AttractorInspector />
              {:else if section.key === 'trajectory'}
                <TrajectoryConfig />
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <SoundEngine />
  <button
    onclick={() => open = !open}
    class="text-neutral-600 hover:text-neutral-400 font-mono text-sm px-2 py-1"
    aria-label="toggle admin panel"
  >
    ⚙
  </button>
</div>
