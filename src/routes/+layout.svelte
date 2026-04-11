<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { themeStore } from '$lib/stores/theme';

  injectAnalytics();
  let { children } = $props();

  onMount(() => {
    themeStore.hydrate();
  });
</script>

<div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
  {@render children()}
</div>
