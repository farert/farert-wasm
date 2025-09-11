<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { AlertTriangle, RefreshCw, Home, Info } from 'lucide-svelte';

	export let fallbackComponent: any = null;
	export let showDetails = false;

	let hasError = false;
	let errorDetails: { message: string; stack?: string; timestamp: Date } | null = null;

	function handleError(event: ErrorEvent | PromiseRejectionEvent) {
		console.error('ErrorBoundary caught error:', event);
		
		hasError = true;
		
		if (event instanceof ErrorEvent) {
			errorDetails = {
				message: event.message || 'An unexpected error occurred',
				stack: event.error?.stack,
				timestamp: new Date()
			};
		} else {
			// PromiseRejectionEvent
			errorDetails = {
				message: event.reason?.message || String(event.reason) || 'An unexpected promise rejection occurred',
				stack: event.reason?.stack,
				timestamp: new Date()
			};
		}
	}

	function retry() {
		hasError = false;
		errorDetails = null;
		// Reload the page to reset the application state
		window.location.reload();
	}

	function goHome() {
		window.location.href = '/';
	}

	function toggleDetails() {
		showDetails = !showDetails;
	}

	onMount(() => {
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleError);
	});

	onDestroy(() => {
		window.removeEventListener('error', handleError);
		window.removeEventListener('unhandledrejection', handleError);
	});
</script>

{#if hasError}
	{#if fallbackComponent}
		<svelte:component this={fallbackComponent} {errorDetails} {retry} {goHome} />
	{:else}
		<div class="error-boundary">
			<div class="error-content">
				<div class="error-icon">
					<AlertTriangle class="w-12 h-12 text-red-500" />
				</div>
				
				<div class="error-text">
					<h2 class="error-title">Something went wrong</h2>
					<p class="error-message">
						{errorDetails?.message || 'An unexpected error occurred while loading the application.'}
					</p>
					
					{#if errorDetails?.timestamp}
						<p class="error-timestamp">
							Error occurred at: {errorDetails.timestamp.toLocaleString()}
						</p>
					{/if}
				</div>

				<div class="error-actions">
					<button class="btn btn-primary" on:click={retry}>
						<RefreshCw class="w-4 h-4" />
						Retry
					</button>
					
					<button class="btn btn-secondary" on:click={goHome}>
						<Home class="w-4 h-4" />
						Go Home
					</button>
					
					{#if errorDetails?.stack}
						<button class="btn btn-secondary" on:click={toggleDetails}>
							<Info class="w-4 h-4" />
							{showDetails ? 'Hide' : 'Show'} Details
						</button>
					{/if}
				</div>

				{#if showDetails && errorDetails?.stack}
					<div class="error-details">
						<h3 class="error-details-title">Error Details</h3>
						<pre class="error-stack">{errorDetails.stack}</pre>
					</div>
				{/if}

				<div class="error-help">
					<p class="error-help-text">
						If this problem persists, please check:
					</p>
					<ul class="error-help-list">
						<li>Your internet connection</li>
						<li>Browser console for additional errors</li>
						<li>That JavaScript is enabled</li>
						<li>WebAssembly support in your browser</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<slot />
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
		background: #fef2f2;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		max-width: 600px;
		text-align: center;
		background: white;
		padding: 3rem;
		border-radius: 1rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border: 1px solid #fecaca;
	}

	.error-icon {
		padding: 1rem;
		background: #fef2f2;
		border-radius: 50%;
	}

	.error-text {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #dc2626;
		margin: 0;
	}

	.error-message {
		font-size: 1rem;
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	.error-timestamp {
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
		margin: 0;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.error-details {
		width: 100%;
		text-align: left;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-top: 1rem;
	}

	.error-details-title {
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.error-stack {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.75rem;
		color: #6b7280;
		background: white;
		padding: 0.75rem;
		border-radius: 0.25rem;
		border: 1px solid #d1d5db;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		margin: 0;
		max-height: 200px;
		overflow-y: auto;
	}

	.error-help {
		text-align: left;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 0.5rem;
		padding: 1rem;
		width: 100%;
	}

	.error-help-text {
		font-size: 0.875rem;
		color: #1e40af;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.error-help-list {
		font-size: 0.875rem;
		color: #1e40af;
		margin: 0;
		padding-left: 1.25rem;
	}

	.error-help-list li {
		margin-bottom: 0.25rem;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.error-boundary {
			background: #1f2937;
		}

		.error-content {
			background: #374151;
			border-color: #f87171;
		}

		.error-icon {
			background: #451a03;
		}

		.error-title {
			color: #f87171;
		}

		.error-message {
			color: #d1d5db;
		}

		.error-timestamp {
			color: #9ca3af;
		}

		.error-details {
			background: #1f2937;
			border-color: #4b5563;
		}

		.error-details-title {
			color: #f3f4f6;
		}

		.error-stack {
			background: #111827;
			color: #d1d5db;
			border-color: #4b5563;
		}

		.error-help {
			background: #1e3a8a;
			border-color: #3b82f6;
		}

		.error-help-text,
		.error-help-list {
			color: #bfdbfe;
		}
	}
</style>