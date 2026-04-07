<script lang="ts">
  import '../app.css';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  injectAnalytics();
  let { children } = $props();
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300">
  {@render children()}
</div>
