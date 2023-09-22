<script lang="ts">
	import { applyAction, deserialize } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { t } from "svelte-i18n";
	import type { ActionData } from "./$types";

	export let form: ActionData;

	let checking = false;
	async function submit(event: { currentTarget: EventTarget & HTMLFormElement }) {
		if (event.currentTarget.file.files[0].size > 50 * 1024 * 1024) {
			alert("File size is too large!");
			return;
		}

		checking = true;
		try {
			const data = new FormData(event.currentTarget);

			const response = await fetch(event.currentTarget.action, {
				method: "POST",
				body: data,
			});

			const result = deserialize(await response.text());

			if (response.ok) {
				console.log(result);
				await invalidateAll();
			}

			applyAction(result);
		} finally {
			checking = false;
		}
	}
</script>

<svelte:head>
	<title>Canary Probe</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center gap-12 p-4">
	<form method="POST" enctype="multipart/form-data" on:submit|preventDefault={submit}>
		<input class="file-input" disabled={checking} type="file" name="file" accept=".zip" />
		<input class="btn" disabled={checking} type="submit" value={$t("upload")} />
	</form>
	{#if form}
		<div class="prose max-w-md">
			{#if form.success === false}
				<h1 class="text-error">Pre-tests Failed!</h1>
				{form.body}
			{:else}
				<h1 class="text-success">Pre-tests Passed!</h1>
				<p>
					We can find those executables in your homework: <br />
					{form.body}
				</p>
			{/if}
		</div>
	{:else if checking}
		<div class="prose max-w-md">
			<p class="animate-pulse">{$t("checking")}</p>
		</div>
	{/if}

	<div>
		<p class="text-sm">
			See <a href="https://github.com/JacobLinCool/canary-probe" target="_blank"
				>GitHub repository</a
			> for local version.
		</p>
	</div>
</div>
