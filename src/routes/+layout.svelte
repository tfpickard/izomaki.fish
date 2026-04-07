<script lang="ts">
  import '../app.css';
  import { Analytics } from '@vercel/analytics/svelte';
  let { children } = $props();
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300">
  {@render children()}
</div>
<Analytics />
