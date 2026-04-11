<script lang="ts">
  import type { UserProfile } from '$lib/types';

  interface Props {
    profile: UserProfile;
    onSaved?: () => void;
  }

  let { profile, onSaved }: Props = $props();

  let handle = $state(profile.handle ?? '');
  let bio = $state(profile.bio ?? '');
  let website = $state(profile.links?.website ?? '');
  let mastodon = $state(profile.links?.mastodon ?? '');
  let github = $state(profile.links?.github ?? '');

  let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');

  async function save() {
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
    setTimeout(() => {
      saveStatus = 'idle';
      onSaved?.();
    }, 1500);
  }
</script>

<div class="flex flex-col gap-3 font-mono text-xs">
  <div class="flex flex-col gap-1">
    <label class="text-[var(--color-fg-dim)]">handle</label>
    <input
      bind:value={handle}
      onblur={save}
      maxlength={32}
      placeholder="optional"
      class="bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder-[var(--color-fg-faint)] outline-none py-0.5 focus:border-[var(--color-fg-dim)]"
    />
  </div>

  <div class="flex flex-col gap-1">
    <label class="text-[var(--color-fg-dim)]">bio <span class="text-[var(--color-fg-faint)]">{bio.length}/160</span></label>
    <textarea
      bind:value={bio}
      onblur={save}
      maxlength={160}
      rows={3}
      placeholder="optional"
      class="bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder-[var(--color-fg-faint)] outline-none resize-none py-0.5 focus:border-[var(--color-fg-dim)]"
    ></textarea>
  </div>

  <div class="flex flex-col gap-1">
    <label class="text-[var(--color-fg-dim)]">website</label>
    <input
      bind:value={website}
      onblur={save}
      type="url"
      placeholder="https://"
      class="bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder-[var(--color-fg-faint)] outline-none py-0.5 focus:border-[var(--color-fg-dim)]"
    />
  </div>

  <div class="flex flex-col gap-1">
    <label class="text-[var(--color-fg-dim)]">mastodon</label>
    <input
      bind:value={mastodon}
      onblur={save}
      placeholder="@user@instance"
      class="bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder-[var(--color-fg-faint)] outline-none py-0.5 focus:border-[var(--color-fg-dim)]"
    />
  </div>

  <div class="flex flex-col gap-1">
    <label class="text-[var(--color-fg-dim)]">github</label>
    <input
      bind:value={github}
      onblur={save}
      placeholder="username"
      class="bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder-[var(--color-fg-faint)] outline-none py-0.5 focus:border-[var(--color-fg-dim)]"
    />
  </div>

  {#if saveStatus === 'saving'}
    <span class="text-[var(--color-fg-faint)]">saving...</span>
  {:else if saveStatus === 'saved'}
    <span class="text-[var(--color-fg-dim)]">saved</span>
  {/if}
</div>
