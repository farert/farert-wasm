<!--
  Error Boundary Component
  
  Catches and handles errors from child components, providing graceful fallback UI.
  Essential for production applications to prevent complete app crashes.
  
  @component ErrorBoundary
  @author Farert SvelteKit Example
  @version 1.0.0
-->

<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { AlertTriangle, RefreshCw, Home } from 'lucide-svelte';
	
	/**
	 * Custom fallback component to render when error occurs
	 */
	export let fallback: any = null;
	
	/**
	 * Whether to show detailed error information (development mode)
	 */
	export let showDetails: boolean = import.meta.env.DEV;
	
	/**
	 * Custom error message to display
	 */
	export let message: string = 'アプリケーションでエラーが発生しました';
	
	/**
	 * Whether to show retry button
	 */
	export let showRetry: boolean = true;
	
	/**
	 * Whether to show navigation to home
	 */
	export let showHome: boolean = true;
	
	// State
	let hasError = false;
	let error: Error | null = null;
	let errorInfo: any = null;
	let retryCount = 0;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		error: { error: Error; errorInfo: any; retryCount: number };
		retry: { retryCount: number };
		recover: void;
	}>();
	
	// Error handling
	function handleError(event: ErrorEvent | PromiseRejectionEvent) {
		console.error('[ErrorBoundary] Caught error:', event);
		
		let errorObj: Error;
		let additionalInfo: any = {};
		
		if (event instanceof ErrorEvent) {
			errorObj = new Error(event.message);
			errorObj.stack = event.error?.stack;
			additionalInfo = {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				type: 'ErrorEvent'
			};
		} else {
			errorObj = event.reason instanceof Error 
				? event.reason 
				: new Error(String(event.reason));
			additionalInfo = {
				type: 'PromiseRejectionEvent'
			};
		}
		
		hasError = true;
		error = errorObj;
		errorInfo = {
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href,
			retryCount,
			...additionalInfo
		};
		
		// Dispatch error event
		dispatch('error', { error: errorObj, errorInfo, retryCount });
		
		// Prevent default error handling
		event.preventDefault();
	}
	
	// Retry functionality
	function retry() {
		retryCount++;
		hasError = false;
		error = null;
		errorInfo = null;
		
		dispatch('retry', { retryCount });
		
		// Force re-render by updating a reactive variable
		// This will cause child components to remount
		setTimeout(() => {
			if (hasError) {
				console.warn('[ErrorBoundary] Error persisted after retry');
			}
		}, 100);
	}
	
	// Recovery functionality
	function recover() {
		hasError = false;
		error = null;
		errorInfo = null;
		retryCount = 0;
		
		dispatch('recover');
	}
	
	// Navigate to home
	function goHome() {
		window.location.href = '/';
	}
	
	// Format error details for display
	function formatErrorDetails(error: Error, errorInfo: any): string {
		let details = `Error: ${error.message}\n\n`;
		
		if (error.stack) {
			details += `Stack Trace:\n${error.stack}\n\n`;
		}
		
		if (errorInfo) {
			details += `Additional Information:\n`;
			details += `Timestamp: ${errorInfo.timestamp}\n`;
			details += `URL: ${errorInfo.url}\n`;
			details += `Type: ${errorInfo.type}\n`;
			
			if (errorInfo.filename) {
				details += `File: ${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}\n`;
			}
			
			details += `Retry Count: ${errorInfo.retryCount}\n`;
			details += `User Agent: ${errorInfo.userAgent}\n`;
		}
		
		return details;
	}
	
	// Mount error handlers
	onMount(() => {
		// Handle JavaScript errors
		window.addEventListener('error', handleError);
		
		// Handle promise rejections
		window.addEventListener('unhandledrejection', handleError);
		
		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleError);
		};
	});
</script>

{#if hasError}
	<!-- Custom fallback component if provided -->
	{#if fallback}
		<svelte:component this={fallback} {error} {errorInfo} {retry} {recover} />
	{:else}
		<!-- Default error UI -->
		<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
			<div class="max-w-md w-full text-center">
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
					<!-- Error Icon -->
					<div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
						<AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" />
					</div>
					
					<!-- Error Title -->
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
						エラーが発生しました
					</h2>
					
					<!-- Error Message -->
					<p class="text-gray-600 dark:text-gray-400 mb-6">
						{message}
					</p>
					
					<!-- Action Buttons -->
					<div class="flex flex-col sm:flex-row gap-3 justify-center">
						{#if showRetry}
							<button
								type="button"
								on:click={retry}
								class="btn-farert inline-flex items-center justify-center"
							>
								<RefreshCw class="w-4 h-4 mr-2" />
								再試行
								{#if retryCount > 0}
									<span class="ml-1 text-xs opacity-75">({retryCount})</span>
								{/if}
							</button>
						{/if}
						
						{#if showHome}
							<button
								type="button"
								on:click={goHome}
								class="btn-farert-outline inline-flex items-center justify-center"
							>
								<Home class="w-4 h-4 mr-2" />
								ホームに戻る
							</button>
						{/if}
					</div>
					
					<!-- Error Details (Development mode only) -->
					{#if showDetails && error}
						<details class="mt-6 text-left">
							<summary class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
								エラー詳細を表示
							</summary>
							<div class="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-md">
								<pre class="text-xs text-gray-800 dark:text-gray-200 overflow-auto whitespace-pre-wrap">{formatErrorDetails(error, errorInfo)}</pre>
							</div>
						</details>
					{/if}
					
					<!-- Recovery hint -->
					{#if retryCount > 2}
						<div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
							<p class="text-sm text-amber-700 dark:text-amber-300">
								問題が続く場合は、ページを再読み込みするか、しばらく時間をおいて再度お試しください。
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{:else}
	<!-- Render children when no error -->
	<slot />
{/if}

<style>
	/* Custom scrollbar for error details */
	pre {
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
	}
	
	pre::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	
	pre::-webkit-scrollbar-track {
		background: transparent;
	}
	
	pre::-webkit-scrollbar-thumb {
		background: rgba(156, 163, 175, 0.5);
		border-radius: 3px;
	}
	
	pre::-webkit-scrollbar-thumb:hover {
		background: rgba(156, 163, 175, 0.7);
	}
</style>