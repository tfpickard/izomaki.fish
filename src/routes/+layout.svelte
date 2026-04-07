<script lang="ts">
  import '../app.css';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { dev } from '$app/environment';
  
  let { children } = $props();
  
  injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300">
  {@render children()}
</div>
