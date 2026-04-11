<script lang="ts">
  import IdentityTab from './IdentityTab.svelte';
  import QuestionsTab from './QuestionsTab.svelte';
  import ShareTab from './ShareTab.svelte';
  import type { UserProfile } from '$lib/types';

  interface Props {
    profile: UserProfile;
    open: boolean;
    onClose: () => void;
  }

  let { profile, open, onClose }: Props = $props();

  type Tab = 'identity' | 'questions' | 'share';
  let activeTab = $state<Tab>('identity');

  let dialogEl = $state<HTMLElement | null>(null);

  function onKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogEl) return;

    const focusable = dialogEl.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  $effect(() => {
    if (open && dialogEl) {
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center"
    role="presentation"
  >
    <!-- Backdrop -->
    <button
      class="absolute inset-0 bg-black/60"
      aria-label="close"
      onclick={onClose}
      tabindex="-1"
    ></button>

    <!-- Dialog panel -->
    <div
      bind:this={dialogEl}
      role="dialog"
      aria-modal="true"
      aria-label="profile"
      class="relative z-10 w-full max-w-md max-h-[90vh] bg-[var(--color-bg-elev)] border border-[var(--color-border)] flex flex-col font-mono text-xs overflow-hidden"
    >
      <!-- Tabs -->
      <div class="flex border-b border-[var(--color-border)] shrink-0">
        {#each [
          { key: 'identity' as Tab, label: 'identity' },
          { key: 'questions' as Tab, label: 'ten questions' },
          { key: 'share' as Tab, label: 'share' }
        ] as tab}
          <button
            onclick={() => activeTab = tab.key}
            class="px-4 py-3 text-xs font-mono border-b-2 transition-colors {activeTab === tab.key
              ? 'border-[var(--color-accent)] text-[var(--color-fg)]'
              : 'border-transparent text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]'}"
          >
            {tab.label}
          </button>
        {/each}
        <div class="flex-1"></div>
        <button
          onclick={onClose}
          class="px-4 py-3 text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]"
          aria-label="close"
        >
          ×
        </button>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if activeTab === 'identity'}
          <IdentityTab {profile} />
        {:else if activeTab === 'questions'}
          <QuestionsTab answers={profile.bioAnswers ?? {}} />
        {:else if activeTab === 'share'}
          <ShareTab handle={profile.handle} />
        {/if}
      </div>
    </div>
  </div>
{/if}
