<script lang="ts">
  import { themeStore, type ThemeMode } from '$lib/stores/theme';

  interface Props {
    handle: string | null;
  }

  let { handle }: Props = $props();

  let copied = $state(false);

  function profileUrl(): string {
    if (!handle) return '';
    return `${window.location.origin}/u/${handle}`;
  }

  async function copyLink() {
    if (!handle) return;
    await navigator.clipboard.writeText(profileUrl());
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }

  const MODES: { value: ThemeMode; label: string }[] = [
    { value: 'dark', label: 'dark' },
    { value: 'light', label: 'light' },
    { value: 'auto', label: 'auto (timezone)' },
    { value: 'system', label: 'system' }
  ];
</script>

<div class="flex flex-col gap-6 font-mono text-xs">
  <div class="flex flex-col gap-2">
    <span class="text-[var(--color-fg-dim)]">theme</span>
    <div class="flex flex-col gap-1">
      {#each MODES as mode}
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="theme-mode"
            value={mode.value}
            checked={$themeStore.mode === mode.value}
            onchange={() => themeStore.setMode(mode.value)}
            class="accent-[var(--color-accent)]"
          />
          <span class="{$themeStore.mode === mode.value ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-dim)]'}">{mode.label}</span>
        </label>
      {/each}
    </div>
  </div>

  {#if handle}
    <div class="flex flex-col gap-2">
      <span class="text-[var(--color-fg-dim)]">public profile</span>
      <div class="flex items-center gap-2">
        <span class="text-[var(--color-fg-faint)] truncate flex-1">/u/{handle}</span>
        <button
          onclick={copyLink}
          class="shrink-0 text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] border border-[var(--color-border)] px-2 py-0.5"
        >
          {copied ? 'copied' : 'copy link'}
        </button>
      </div>
    </div>
  {:else}
    <span class="text-[var(--color-fg-faint)]">set a handle in Identity to get a public profile link</span>
  {/if}

  <div class="pt-2 border-t border-[var(--color-border)]">
    <form action="/auth/logout" method="POST">
      <button type="submit" class="text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]">
        sign out
      </button>
    </form>
  </div>
</div>
