<script lang="ts">
  import type { UserProfile } from '$lib/types';

  interface Props {
    profile: UserProfile;
    creatureLastGeneratedAt: string | null;
  }

  let { profile: initialProfile, creatureLastGeneratedAt }: Props = $props();

  let open = $state(false);

  let handle = $state(initialProfile.handle ?? '');
  let bio = $state(initialProfile.bio ?? '');
  let website = $state(initialProfile.links?.website ?? '');
  let mastodon = $state(initialProfile.links?.mastodon ?? '');
  let github = $state(initialProfile.links?.github ?? '');

  let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
  let generating = $state(false);
  let generateError = $state<string | null>(null);

  function canGenerate(): boolean {
    if (!creatureLastGeneratedAt) return true;
    return Date.now() - new Date(creatureLastGeneratedAt).getTime() >= 5 * 60 * 1000;
  }

  async function saveProfile() {
    saveStatus = 'saving';
    const links: UserProfile['links'] = {};
    if (website) links.website = website;
    if (mastodon) links.mastodon = mastodon;
    if (github) links.github = github;

    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: handle || null,
        bio: bio || null,
        links
      })
    });
    saveStatus = 'saved';
    setTimeout(() => { saveStatus = 'idle'; }, 2000);
  }

  async function generate() {
    generating = true;
    generateError = null;
    const res = await fetch('/api/creature/generate', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      generateError = body.error ?? 'failed';
    }
    generating = false;
  }
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col items-end gap-0">
  <button
    onclick={() => open = !open}
    class="text-neutral-600 hover:text-neutral-400 font-mono text-xs px-2 py-1 select-none"
    aria-label="toggle user menu"
  >
    {initialProfile.handle ? '@' + initialProfile.handle : '·'}
  </button>

  {#if open}
    <div class="mt-0 w-64 bg-neutral-900 border-l border-neutral-800 flex flex-col text-xs font-mono">

      <div class="border-b border-neutral-800 px-3 py-3 flex flex-col gap-2">
        <label class="text-neutral-600">handle</label>
        <input
          bind:value={handle}
          onblur={saveProfile}
          maxlength={32}
          placeholder="optional"
          class="bg-transparent border-b border-neutral-800 text-neutral-300 placeholder-neutral-700 outline-none py-0.5"
        />

        <label class="text-neutral-600 mt-1">bio</label>
        <textarea
          bind:value={bio}
          onblur={saveProfile}
          maxlength={160}
          rows={2}
          placeholder="optional"
          class="bg-transparent border-b border-neutral-800 text-neutral-300 placeholder-neutral-700 outline-none resize-none py-0.5"
        ></textarea>

        <label class="text-neutral-600 mt-1">website</label>
        <input
          bind:value={website}
          onblur={saveProfile}
          type="url"
          placeholder="https://"
          class="bg-transparent border-b border-neutral-800 text-neutral-300 placeholder-neutral-700 outline-none py-0.5"
        />

        <label class="text-neutral-600 mt-1">mastodon</label>
        <input
          bind:value={mastodon}
          onblur={saveProfile}
          placeholder="@user@instance"
          class="bg-transparent border-b border-neutral-800 text-neutral-300 placeholder-neutral-700 outline-none py-0.5"
        />

        <label class="text-neutral-600 mt-1">github</label>
        <input
          bind:value={github}
          onblur={saveProfile}
          placeholder="username"
          class="bg-transparent border-b border-neutral-800 text-neutral-300 placeholder-neutral-700 outline-none py-0.5"
        />

        {#if saveStatus === 'saving'}
          <span class="text-neutral-700 mt-1">saving...</span>
        {:else if saveStatus === 'saved'}
          <span class="text-neutral-600 mt-1">saved</span>
        {/if}
      </div>

      <div class="border-b border-neutral-800 px-3 py-2">
        <button
          onclick={generate}
          disabled={generating || !canGenerate()}
          class="text-neutral-500 hover:text-neutral-300 disabled:text-neutral-800 disabled:cursor-default"
        >
          {generating ? 'generating...' : 'generate frame'}
        </button>
        {#if generateError}
          <span class="text-neutral-700 ml-2">{generateError}</span>
        {/if}
      </div>

      <div class="px-3 py-2">
        <form action="/auth/logout" method="POST">
          <button type="submit" class="text-neutral-500 hover:text-neutral-300">
            sign out
          </button>
        </form>
      </div>

    </div>
  {/if}
</div>
