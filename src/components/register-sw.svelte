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
  import { createServiceWorker } from "./service-worker";

  onMount(() => {});

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
      position: "top-right",
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

  const intervalMS = 60 * 60 * 1000;

  function RegisterServiceWorker() {
    const { offlineReady, needRefresh, updateServiceWorker } =
      createServiceWorker({
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
                await toastPromise(updateServiceWorker(true), {
                  loading: "Updating...",
                  success: "Update Successful",
                  error: "Error Updating",
                });
              },
              dismissClick() {
                close();
              },
            }
          );
        },
        onRegistered(r) {
          console.log("SW Registered: small change", r);
          r &&
            setInterval(() => {
              r.update();
            }, intervalMS);
        },
        onRegisterError(error) {
          console.log("SW registration error", error);
        },
      });

    function close() {
      offlineReady.set(false);
      needRefresh.set(false);
    }
  }

  if ("navigator" in globalThis) {
    RegisterServiceWorker();
  }
</script>

<Toaster />
