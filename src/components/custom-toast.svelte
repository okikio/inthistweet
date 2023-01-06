<script>
  import toast_ from 'svelte-french-toast';
  import { resolveValue, LoaderIcon, CheckmarkIcon, ErrorIcon } from 'svelte-french-toast';

  import FluentDismiss24Regular from "~icons/fluent/dismiss-24-regular";
  import FluentArrowClockwise24Regular from '~icons/fluent/arrow-clockwise-24-regular';

  export let toast;
  export let position = undefined;
  export let style = '';
  export let Component = undefined;
  let factor;
  let animation;
  $: {
      const top = (toast.position || position || 'top-center').includes('top');
      factor = top ? 1 : -1;
      const [enter, exit] = prefersReducedMotion() ? ['fadeIn', 'fadeOut'] : ['enter', 'exit'];
      animation = toast.visible ? enter : exit;
  }

  const toastBarBase = `
    display: flex;
    align-items: center;
    pointer-events: auto;
    line-height: 1.3;
    will-change: transform;
  `;

  const messageContainer = `
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    margin: 4px 10px;
    white-space: pre-line;
  `;

  const iconContainer = `
    flex-shrink: 0px;
    min-width: 20px;
    min-height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  `;

  // Use this component in your app:
  //     toast(RichContent)
</script>

<div
  class="{toast.height ? animation : 'transparent'} {toast.className || ''}"
  style={toastBarBase + " " + toast.style}
  data-type={toast.toastType}
>
  {#if toast.icon}
    <div style={iconContainer} class="icon-container">{toast.icon}</div>
  {:else if toast.toastType === 'loading'}
    <div style={iconContainer} class="icon-container">
      <LoaderIcon {...toast.iconTheme} />
    </div>
  
  {:else if toast.toastType === 'success'}
    <div style={iconContainer} class="icon-container">
      <CheckmarkIcon {...toast.iconTheme} />
    </div>
  {:else if toast.toastType === 'error'}
    <div style={iconContainer}>
      <ErrorIcon {...toast.iconTheme} />
    </div>
  {/if}

  <div style={messageContainer} {...toast.ariaProps}>
    {resolveValue(toast.messageStr, toast)}
  </div>
  
  <div class="flex gap-1.5">
    {#if toast.toastType === 'update'}
      <button 
        type="button"
        class="reload-button"
        aria-label="Reload"
        on:click={toast?.updateClick}
      >
        <FluentArrowClockwise24Regular />
      </button>
    {/if}

    <button 
      type="button"
      class="cancel-button"
      aria-label="Dismiss"
      onClick={(e) => {
        if (typeof toast?.dismissClick == "function")
          toast?.dismissClick?.(e);

        toast_.dismiss(toast.id);
      }}
    >
      <FluentDismiss24Regular />
    </button>
  </div>
</div>

<style lang="scss" global>
	.toast {
		will-change: transform;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);

		max-width: min(250px, 100%);
		@apply sm:max-w-[425px];

		// transition-property: background-color, border-color, text-decoration-color,
		// 	fill, stroke;
		// @apply transition-colors duration-300;

		@apply bg-blue-100/90 dark:bg-elevated/70;
		@apply backdrop-blur-lg rounded-full;
		@apply w-[350px];

		@apply pl-4 pr-2 py-2;
		@apply border-2 border-dashed border-secondary dark:border-slate-700;

		.reload-button,
		.cancel-button {
			@apply scale-100 hover:scale-110 active:scale-90;

			@apply rounded-full;
			@apply bg-secondary/20 p-2;
		}

		&[data-type="error"] {
			@apply bg-red-100/90 dark:bg-red-700/30;
			@apply border-red-300 dark:border-red-700;

			.icon-container svg path {
				@apply stroke-red-200 dark:stroke-red-900;
			}

			.cancel-button {
				@apply text-red-800 dark:text-red-200;
				@apply bg-red-300/90 dark:bg-red-200/30;
			}
		}

		&[data-type="success"] {
			@apply bg-green-200/90 dark:bg-green-700/30;
			@apply border-green-400 dark:border-green-700;

			.icon-container svg path {
				@apply stroke-green-200 dark:stroke-green-900;
			}

			.cancel-button {
				@apply text-green-800 dark:text-green-200;
				@apply bg-green-400/70 dark:bg-green-200/30;
			}
		}

		&[data-type="loading"] {
			@apply bg-gray-100/90 dark:bg-blue-700/30;
			@apply border-gray-400 dark:border-blue-700;

			.loading-circle {
				@apply stroke-slate-300;
			}

			.cancel-button {
				@apply text-gray-800 dark:text-blue-200;
				@apply bg-gray-300/90 dark:bg-blue-200/30;
			}
		}

		&[data-type="update"] {
			@apply bg-yellow-100/90 dark:bg-yellow-700/30;
			@apply border-yellow-400 dark:border-yellow-700;
			@apply lt-sm:flex-col gap-1.5;
			@apply lt-sm:rounded-xl;

			.loading-circle {
				@apply stroke-yellow-300;
			}

			.reload-button,
			.cancel-button {
				@apply text-yellow-800 dark:text-yellow-200;
				@apply bg-yellow-300/90 dark:bg-yellow-200/30;

				&:hover {
					@apply bg-yellow-400/90 dark:bg-yellow-700/40;
				}
			}
		}
	}
</style>