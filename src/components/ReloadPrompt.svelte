<script lang="ts">
  import type {
    Renderable,
    DefaultToastOptions,
    ToastOptions,
    ToastType,
  } from "svelte-french-toast";

  import { onMount } from "svelte";
  import toast, { Toaster, resolveValue } from "svelte-french-toast";
  import CustomToast from "./custom-toast.svelte";
  import { createServiceWorker } from "./pwa";

  type CustomToastType = ToastType | "update";
  type CustomToastOptions = {
    messageStr?: Renderable | string;
    toastType?: CustomToastType;
    updateClick?: () => Promise<void>;
    dismissClick?: () => void;
  };

  function customToast(
    type: CustomToastType,
    message: Renderable | string,
    options?: ToastOptions & CustomToastOptions
  ) {
    return toast.custom(CustomToast, {
      position: "bottom-right",
      className: "toast",
      // @ts-ignore
      toastType: type,
      // @ts-ignore
      messageStr: message,
      ...options,
    });
  }

  function toastPromise<T>(
    promise: Promise<T>,
    msgs: {
      loading: Renderable;
      success: Renderable;
      error: Renderable;
    },
    opts?: DefaultToastOptions | undefined
  ): Promise<T> {
    const id = customToast("loading", msgs.loading, {
      ...opts,
      ...opts?.loading,
    });
    promise
      .then((p) => {
        customToast("success", resolveValue(msgs.success, p), {
          id,
          ...opts,
          ...opts?.success,
        });
        return p;
      })
      .catch((e) => {
        customToast("error", resolveValue(msgs.error, e), {
          id,
          ...opts,
          ...opts?.error,
        });
      });
    return promise;
  }

  const intervalMS = 60 * 1000;
  let intervalTimer: number | undefined;

  function RegisterServiceWorker() {
    const { offlineReady, needRefresh, refreshSW } = createServiceWorker({
      onOfflineReady() {
        customToast("success", "App ready to work offline");
      },
      onNeedRefresh() {
        customToast(
          "update",
          "New content available, click on reload button to update",
          {
            duration: Infinity,
            async updateClick() {
              await toastPromise(refreshSW(true), {
                loading: "Updating...",
                success: "Update Successful",
                error: "Error Updating",
              });
            },
            dismissClick() {
              offlineReady.set(false);
              needRefresh.set(false);
            },
          }
        );
      },
      onRegisteredSW(swUrl, r) {
        console.log(`SW Registered: ${swUrl}`, r);
        r && setInterval(async () => {
          if (!(!r.installing && navigator))
            return

          if (('connection' in navigator) && !navigator.onLine)
            return

          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: {
              'cache': 'no-store',
              'cache-control': 'no-cache',
            },
          })

          if (resp?.status === 200)
            await r.update()
        }, intervalMS)
      },
      onRegisterError(error: any) {
        console.log("SW registration error", error);
      },
    });
  }

  onMount(() => {
    if ("navigator" in globalThis) {
      RegisterServiceWorker();
    }
  })
</script>

<Toaster />
