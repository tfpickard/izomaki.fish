<script lang="ts">
  import { QUESTIONS, questionId } from '$lib/data/questions';

  interface Props {
    answers: Record<string, string>;
  }

  let { answers: initialAnswers }: Props = $props();

  let answers = $state<Record<string, string>>({ ...initialAnswers });
  let savingId = $state<string | null>(null);
  let savedId = $state<string | null>(null);

  async function save(index: number) {
    const id = questionId(index);
    const value = (answers[id] ?? '').trim().slice(0, 280);
    savingId = id;

    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bioAnswers: { [id]: value } })
    });

    savingId = null;
    savedId = id;
    setTimeout(() => { savedId = null; }, 1500);
  }
</script>

<div class="flex flex-col gap-6 font-mono text-xs">
  {#each QUESTIONS as question, i}
    {@const id = questionId(i)}
    <div class="flex flex-col gap-2">
      <p class="text-[var(--color-fg-dim)] leading-relaxed">{i + 1}. {question}</p>
      <div class="relative">
        <textarea
          bind:value={answers[id]}
          onblur={() => save(i)}
          maxlength={280}
          rows={2}
          placeholder="..."
          class="w-full bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder-[var(--color-fg-faint)] outline-none resize-none py-0.5 focus:border-[var(--color-fg-dim)]"
        ></textarea>
        {#if savingId === id}
          <span class="absolute right-0 bottom-2 text-[var(--color-fg-faint)]">saving...</span>
        {:else if savedId === id}
          <span class="absolute right-0 bottom-2 text-[var(--color-fg-dim)]">saved</span>
        {:else}
          <span class="absolute right-0 bottom-2 text-[var(--color-fg-faint)]">{(answers[id] ?? '').length}/280</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
