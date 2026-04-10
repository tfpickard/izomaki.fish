<script lang="ts">
  import GenerateButton from './GenerateButton.svelte';
  import ProfileModal from '$lib/components/profile/ProfileModal.svelte';
  import type { UserProfile } from '$lib/types';

  interface Props {
    profile: UserProfile;
    creatureLastGeneratedAt: string | null;
  }

  let { profile, creatureLastGeneratedAt }: Props = $props();

  let modalOpen = $state(false);
</script>

<nav class="sticky top-0 z-40 flex items-center justify-between px-4 h-10 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
  <span class="font-mono text-xs text-[var(--color-fg-dim)]">izomaki</span>

  <div class="flex items-center gap-4">
    <GenerateButton lastGeneratedAt={creatureLastGeneratedAt} />

    <button
      onclick={() => modalOpen = true}
      class="font-mono text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] select-none"
      aria-label="profile"
    >
      {profile.handle ? '@' + profile.handle : '·'} ▾
    </button>
  </div>
</nav>

<ProfileModal {profile} open={modalOpen} onClose={() => modalOpen = false} />
