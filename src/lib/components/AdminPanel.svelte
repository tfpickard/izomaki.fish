<script lang="ts">
  import SoundEngine from './SoundEngine.svelte';
  import FrameEditor from './FrameEditor.svelte';
  import FrameLibrary from './FrameLibrary.svelte';
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

  type Section = 'creatures' | 'editor' | 'library';
  let collapsed = $state<Record<Section, boolean>>({
    creatures: false,
    editor: false,
    library: false
  });

  function toggle(section: Section) {
    collapsed[section] = !collapsed[section];
  }
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-0">
  {#if open}
    <div class="w-96 bg-[var(--color-bg-elev)] border-l border-[var(--color-border)] overflow-y-auto max-h-screen pb-10 flex flex-col">
      {#each [
        { key: 'creatures' as Section, label: 'creatures' },
        { key: 'editor'    as Section, label: 'frame editor' },
        { key: 'library'   as Section, label: 'frame library' }
      ] as section}
        <div class="border-b border-[var(--color-border)]">
          <button
            onclick={() => toggle(section.key)}
            class="w-full text-left px-3 py-2 text-xs font-mono text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] flex justify-between items-center"
          >
            <span>{section.label}</span>
            <span>{collapsed[section.key] ? '+' : '-'}</span>
          </button>
          {#if !collapsed[section.key]}
            <div class="px-3 pb-3">
              {#if section.key === 'creatures'}
                <CreatureManager {allCreatures} {maxCreatures} />
              {:else if section.key === 'editor'}
                <FrameEditor />
              {:else if section.key === 'library'}
                <FrameLibrary />
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
    class="text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] font-mono text-sm px-2 py-1"
    aria-label="toggle admin panel"
  >
    ⚙
  </button>
</div>
