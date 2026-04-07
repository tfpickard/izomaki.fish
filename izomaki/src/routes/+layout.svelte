<script>
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300">
  {@render children()}
</div>
