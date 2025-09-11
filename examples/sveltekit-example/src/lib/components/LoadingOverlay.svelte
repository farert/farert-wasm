<script lang="ts">
	export let message = 'Loading...';
	export let progress: number | undefined = undefined;
	export let showProgress = false;
</script>

<div class="loading-overlay" role="status" aria-live="polite" aria-label={message}>
	<div class="loading-content">
		<!-- Spinner -->
		<div class="loading-spinner" />
		
		<!-- Message -->
		<div class="loading-text">
			<h3 class="loading-title">{message}</h3>
			{#if showProgress && typeof progress === 'number'}
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {Math.max(0, Math.min(100, progress))}%"></div>
					</div>
					<span class="progress-text">{Math.round(progress)}%</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 400px;
		text-align: center;
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e5e7eb;
		border-radius: 50%;
		border-top-color: #6366f1;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.loading-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.progress-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 200px;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6366f1, #8b5cf6);
		border-radius: 4px;
		transition: width 0.3s ease-in-out;
	}

	.progress-text {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.loading-overlay {
			background: rgba(17, 24, 39, 0.95);
		}

		.loading-content {
			background: #1f2937;
			color: #f9fafb;
		}

		.loading-title {
			color: #f9fafb;
		}

		.loading-spinner {
			border-color: #374151;
			border-top-color: #6366f1;
		}

		.progress-bar {
			background: #374151;
		}

		.progress-text {
			color: #9ca3af;
		}
	}
</style>